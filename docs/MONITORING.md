# MovieMapUA — Моніторинг та error tracking

---

## Зміст

1. [Огляд](#огляд)
2. [Health endpoint](#health-endpoint)
3. [Sentry — error tracking](#sentry--error-tracking)
4. [Render health checks](#render-health-checks)
5. [Як реагувати на алерти](#як-реагувати-на-алерти)

---

## Огляд

Моніторинг MovieMapUA складається з двох рівнів:

| Рівень | Інструмент | Що відстежує |
|--------|------------|--------------|
| Liveness/Readiness | `/api/health` endpoint | Чи живий бекенд, чи підключений до MongoDB |
| Error tracking | Sentry (backend + frontend) | Unhandled exceptions, помилки рендеру React |

Health endpoint використовується автоматично в CD smoke tests (`.github/workflows/cd.yml`) і в rollback verification (`.github/workflows/rollback.yml`). Sentry повідомляє про runtime-помилки у боті середовищах.

---

## Health endpoint

### Адреса

- **Staging:** https://gilsgang-team-project-staging-server.onrender.com/api/health
- **Production:** https://gilsgang-team-project.onrender.com/api/health

### Формат відповіді

**200 OK** — все добре:

```json
{
  "status": "ok",
  "uptime": 1234.56,
  "version": "1.1.0",
  "timestamp": "2025-05-19T10:00:00.000Z",
  "mongo": {
    "state": "connected",
    "readyState": 1
  }
}
```

**503 Service Unavailable** — Mongo відвалився:

```json
{
  "status": "degraded",
  "uptime": 1234.56,
  "version": "1.1.0",
  "timestamp": "2025-05-19T10:00:00.000Z",
  "mongo": {
    "state": "disconnected",
    "readyState": 0
  }
}
```

### Поля

| Поле | Тип | Опис |
|------|-----|------|
| `status` | `"ok"` \| `"degraded"` | Загальний стан сервісу |
| `uptime` | number (sec) | Час з моменту запуску процесу Node.js |
| `version` | string | Версія з `package.json` |
| `timestamp` | ISO-8601 | Час відповіді на сервері |
| `mongo.state` | string | `connected` / `connecting` / `disconnecting` / `disconnected` |
| `mongo.readyState` | number | Mongoose readyState (0..3) |

### Реалізація

- `MovieMapUA-main/api/coursework_back/routes/health.js` — сам роут.
- `MovieMapUA-main/api/coursework_back/app.js` — реєстрація `app.use('/api/health', healthRoute)`.
- `MovieMapUA-main/api/coursework_back/tests/health.test.js` — Jest + supertest тести (connected → 200/ok, disconnected → 503/degraded).

Endpoint навмисно виключений з Sentry tracing (`instrument.js` → `ignoreTransactions: ['GET /api/health']`), щоб поллінг від CD/Render не засмічував квоту.

---

## Sentry — error tracking

### Backend

**Бібліотека:** `@sentry/node@^10`

**Ініціалізація:** `MovieMapUA-main/api/coursework_back/instrument.js` — файл require'иться першим у `app.js` (так вимагає Sentry v8+).

**Error capture:** `Sentry.setupExpressErrorHandler(app)` зареєстрований після всіх роутів. Будь-які unhandled errors з Express middleware/routes відправляться в Sentry.

**Env vars (Render → Backend service → Environment):**

| Variable | Required | Значення |
|----------|----------|----------|
| `SENTRY_DSN` | ✅ | DSN з sentry.io → Settings → Projects → [backend project] → Client Keys |
| `NODE_ENV` | ✅ | `production` (для master) / `staging` (для develop) |

Якщо `SENTRY_DSN` не заданий — ініціалізація скіпається (це поведінка за замовчуванням, щоб локальна розробка не падала).

### Frontend

**Бібліотека:** `@sentry/react@^10`

**Ініціалізація:** `MovieMapUA-main/client/coursework_front/src/index.js` — `Sentry.init()` + обгортка `<Sentry.ErrorBoundary fallback={...}>` навколо `<App />`. Якщо React-компонент кидає під час рендеру — Sentry зловить це і покаже fallback UI.

**Env vars (Render → Frontend service → Environment):**

| Variable | Required | Значення |
|----------|----------|----------|
| `REACT_APP_SENTRY_DSN` | ✅ | DSN з sentry.io для frontend-проєкту (окремий від backend) |
| `REACT_APP_ENV` | ✅ | `production` / `staging` |
| `REACT_APP_VERSION` | optional | `1.1.0` (для прив'язки помилок до релізу) |

⚠️ **Важливо для CRA:** усі `REACT_APP_*` змінні вшиваються в bundle на етапі `npm run build`. Тобто env vars мають бути задані у Render **до** запуску build'у. Якщо додати DSN після першого деплою — треба зробити redeploy (без cache).

### Як створити Sentry проєкти

1. Зареєструватися на https://sentry.io (free plan вистачає для курсової).
2. Create Project → Platform: **Node.js (Express)** для backend.
3. Create Project → Platform: **React** для frontend.
4. Кожен проєкт дає окремий DSN. Скопіювати їх → додати в Render env vars.

---

## Render health checks

Render підтримує автоматичний моніторинг сервісу через health endpoint. Налаштовується разово в UI:

1. Render Dashboard → Backend service → Settings → Health & Alerts.
2. **Health Check Path:** `/api/health`
3. Render буде періодично пінгувати цей шлях. Якщо отримує не-2xx — позначає сервіс як unhealthy і може автоматично рестартувати інстанс (залежить від плану).

Це додає liveness-моніторинг поза CI/CD циклом.

---

## Як реагувати на алерти

### Smoke test fails after deploy
Це найшвидший сигнал. Що робити:
1. Зайди в Render dashboard → дивись логи деплою. Найчастіша причина — `MONGO_URL` неправильна, build впав.
2. Якщо логи нормальні, але `/api/health` повертає 503 → MongoDB Atlas потенційно недоступна (перевір allowlist IP у Atlas).
3. Якщо потрібно повернути попередній стан → див. [ROLLBACK.md](ROLLBACK.md).

### Sentry "issue spike"
Якщо у Sentry за короткий час прилетіло багато однотипних помилок:
1. Глянь stack trace + breadcrumbs у Sentry.
2. Чи помилка з'явилась після нещодавнього деплою? Якщо так — кандидат на rollback.
3. Якщо помилка локальна для одного user-а / одного запиту → fix forward (нова PR).

### `/api/health` повертає `degraded`
- MongoDB Atlas не відповідає. Перевір:
  - Atlas dashboard — чи кластер running.
  - Network access list — чи Render outbound IPs дозволені (часто `0.0.0.0/0` для простоти).
  - Чи не зайнятий весь connection pool.
