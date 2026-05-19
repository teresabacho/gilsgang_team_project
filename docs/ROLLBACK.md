# MovieMapUA — Rollback procedure

---

## Зміст

1. [Коли робити rollback](#коли-робити-rollback)
2. [Процедура через GitHub Actions (рекомендовано)](#процедура-через-github-actions-рекомендовано)
3. [Manual fallback: git revert](#manual-fallback-git-revert)
4. [Manual fallback: redeploy старого коміту з Render UI](#manual-fallback-redeploy-старого-коміту-з-render-ui)
5. [Post-mortem template](#post-mortem-template)
6. [Доступні теги](#доступні-теги)

---

## Коли робити rollback

Rollback — це **тимчасова** міра, щоб швидко повернути робочий стан. Завжди супроводжується issue + fix-forward PR.

**Тригери для rollback:**

| Сигнал | Дія |
|--------|-----|
| Smoke tests fail у `cd.yml` після merge | Rollback, потім розбір |
| `/api/health` повертає 5xx після деплою | Rollback |
| Sentry: різкий ріст помилок (>10x baseline) одразу після релізу | Rollback |
| Користувачі повідомляють про повну непрацездатність UI | Rollback |
| Дані почали псуватись (write-shaped bug) | Rollback **і** написати на Atlas про можливий restore |

**Не rollback'имо коли:**
- Помилка стосується одного user-а / одного edge case → fix forward.
- Косметичний баг UI → fix forward.
- Sentry показав 1-2 помилки за добу → fix forward.

---

## Процедура через GitHub Actions (рекомендовано)

### Крок 1 — Знайти останній стабільний тег

```bash
git fetch --tags
git tag -l --sort=-v:refname | head -5
```

або в GitHub: Repository → Tags / Releases.

На момент написання документу стабільні: `v1.1.0`, `v1.0.0`.

### Крок 2 — Запустити workflow

1. GitHub → **Actions** tab → **Manual Rollback** (ліва панель).
2. **Run workflow** (правий бік):
   - **Tag**: `v1.0.0` (або який потрібен)
   - **Environment**: `production` / `staging`
   - **Target**: `both` (default) / `backend` / `frontend`
3. **Run workflow** → відкривається сторінка прогресу.

### Крок 3 — Що відбувається

`.github/workflows/rollback.yml` (4 jobs):

1. **validate-tag** — перевіряє, що тег існує. Якщо ні — fail, нічого далі не запускається.
2. **rollback-backend** і/або **rollback-frontend** — тригерять Render deploy hook з параметром `?ref=<sha-тегу>`, щоб Render задеплоїв саме той коміт.
3. **verify-rollback** — polling `/api/health` (до ~7.5 хв) і фронту (до ~5 хв). Якщо щось не зелене — job завершиться failure'ом.

### Крок 4 — Якщо verify-rollback fail

Перевір логи job-у. Дві найімовірніші причини:
- **Render `?ref` не спрацював** (план не підтримує) — Render задеплоїв HEAD замість тегу. Тоді переходь до [fallback через git revert](#manual-fallback-git-revert).
- **Render просто повільний** — інколи деплой займає 8+ хвилин на free plan. Зачекай 5 хв і повтори smoke вручну:
  ```bash
  curl https://gilsgang-team-project.onrender.com/api/health
  ```

---

## Manual fallback: git revert

Якщо `?ref=<sha>` параметр у Render не спрацював, гарантований спосіб — повернути deployment-гілку до стану тегу через git, а потім запустити звичайний деплой.

```bash
# 1. Бекап поточного стану (про всяк випадок)
git checkout master
git branch backup/before-rollback-$(date +%Y%m%d-%H%M)
git push origin backup/before-rollback-$(date +%Y%m%d-%H%M)

# 2. Revert до тегу
# Опція A — revert range (НЕ destructive, лишає історію)
git revert --no-edit v1.0.0..HEAD
git push origin master

# Опція B — hard reset (DESTRUCTIVE, потрібен --force-push)
# git reset --hard v1.0.0
# git push origin master --force-with-lease    ⚠️ узгодити з командою!
```

Push на master автоматично тригерить CI → CD → деплой → smoke. Чекаємо ~5-10 хв.

⚠️ **Опція B (force-push)** ламає історію для всієї команди. Узгодити з одногрупниками заздалегідь.

---

## Manual fallback: redeploy старого коміту з Render UI

Якщо обидва підходи вище не зайшли, є ручний варіант у Render:

1. Render Dashboard → потрібний сервіс (наприклад `gilsgang-team-project`).
2. **Events** tab → знайди деплой, який працював (по часу або по commit message).
3. Кнопка **Rollback** біля цього events → Render запустить redeploy того ж артефакту.

Це найшвидший спосіб (1 клік), але **не залишає сліду в git** — тільки в Render events. Тому обов'язково створи issue з описом, що відбулось.

---

## Post-mortem template

Після кожного rollback'у — **завжди** створити GitHub issue з лейблом `post-mortem`:

```markdown
## Incident: <Short description>

**When**: 2026-05-19, 14:30 UTC
**Detected by**: smoke tests / user report / Sentry alert / oncall
**Resolved at**: 2026-05-19, 14:45 UTC
**Duration**: 15 min downtime

## Timeline
- 14:25 — merge PR #123 у master
- 14:27 — CD pipeline зелений, deploy завершено
- 14:30 — smoke tests fail, /api/health 503
- 14:33 — рішення rollback до v1.0.0
- 14:38 — Manual Rollback workflow запущено
- 14:45 — verify-rollback зелений, інцидент закрито

## Root cause
<Що зламалось. Конкретний код / конфіг / env var.>

## Why did this slip past CI?
<Чи тести покривали цей сценарій? Якщо ні — створити tracking issue.>

## Action items
- [ ] Fix-forward PR з реальним фіксом
- [ ] Додати тест, який би зловив цей баг
- [ ] (за потреби) оновити monitoring / alerting
```

---

## Доступні теги

```bash
git tag -l --sort=-v:refname
```

На момент написання документу:
- `v1.1.0` — поточна продакшн-версія (health endpoint + Sentry + smoke tests)
- `v1.0.0` — попередня версія

SemVer policy див. [CD-PROCESS.md](CD-PROCESS.md#semver-policy).
