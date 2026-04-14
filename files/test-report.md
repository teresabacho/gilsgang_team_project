# Test Report — MovieMapUA

## Summary

| Category | File | Tests |
|---|---|:---:|
| Authentication API | `tests/auth.test.js` | 8 |
| Movies API | `tests/movies.test.js` | 14 |
| Locations API | `tests/locations.test.js` | 7 |
| Comments API | `tests/comments.test.js` | 5 |
| User & Favorites API | `tests/user.test.js` | 17 |
| Performance | `tests/performance.test.js` | 10 |
| App Routing (React) | `src/App.test.js` | 6 |
| Header Component (React) | `src/__tests__/Header.test.js` | 7 |
| **Total** | | **74** |

---

## Backend API Tests

### Authentication — `tests/auth.test.js` (8 tests)

#### POST /api/auth/register

| # | Test | What it checks |
|---|------|----------------|
| 1 | registers a new user and returns the user doc | Successful registration returns status 200 with `_id`, `email`, `username`; password is stored hashed |
| 2 | returns 422 when email is already taken | Duplicate email registration is rejected with status 422 |
| 3 | returns 422 when required fields are missing | Request without email or password returns status 422 |

#### POST /api/auth/login

| # | Test | What it checks |
|---|------|----------------|
| 4 | logs in with valid credentials and sets cookie | Correct email/password returns status 200, user email in body, and `token=` in `Set-Cookie` header |
| 5 | returns 400 on wrong password | Wrong password returns status 400 with `error` field |
| 6 | returns 404 when user does not exist | Login with unknown email returns status 404 with `error` field |

#### POST /api/auth/logout

| # | Test | What it checks |
|---|------|----------------|
| 7 | clears the token cookie | Response sets `token` cookie to empty string |

#### GET /api/profile

| # | Test | What it checks |
|---|------|----------------|
| 8 | returns user data when a valid token cookie is present | Valid JWT cookie returns status 200 with correct `_id` and `email` |
| 9 | returns null when no token is present | Request without cookie returns status 200 with `null` body |

---

### Movies — `tests/movies.test.js` (14 tests)

#### GET /api/movie

| # | Test | What it checks |
|---|------|----------------|
| 1 | returns an empty array when no movies exist | Empty database returns status 200 and empty array |
| 2 | returns all movies | After creating 2 movies, response contains 2 items |

#### GET /api/movie/:id

| # | Test | What it checks |
|---|------|----------------|
| 3 | returns a movie by valid ID | Correct movie document returned by ID |
| 4 | returns 404 for non-existent ID | Non-existent ObjectId returns status 404 |

#### GET /api/movie/page

| # | Test | What it checks |
|---|------|----------------|
| 5 | returns paginated movies with totalPages | 5 movies with limit=3 returns 3 items and `totalPages: 2` |
| 6 | filters by genre | `?genre=drama` returns only Drama films (case-insensitive) |
| 7 | filters by year | `?year=2020` returns only films from that year |

#### GET /api/movie/search

| # | Test | What it checks |
|---|------|----------------|
| 8 | returns matching movies by title (case-insensitive) | `?title=тіні` matches "Тіні забутих предків" |
| 9 | returns 422 when title param is missing | Request without `title` query param returns status 422 |

#### POST /api/movie

| # | Test | What it checks |
|---|------|----------------|
| 10 | creates a movie when authenticated | Authenticated request returns status 201 with created movie |
| 11 | returns 401 when not authenticated | Request without token returns status 401 |

#### PUT /api/movie/:id

| # | Test | What it checks |
|---|------|----------------|
| 12 | updates a movie when authenticated as owner | Owner can update title, returns status 200 with updated movie |
| 13 | returns 403 when authenticated as a different user | Non-owner update attempt returns status 403 |

#### DELETE /api/movie/:id

| # | Test | What it checks |
|---|------|----------------|
| 14 | deletes a movie when authenticated as owner | Owner deletes movie, response contains success message |
| 15 | returns 401 when not authenticated | Request without token returns status 401 |

---

### Locations — `tests/locations.test.js` (7 tests)

#### POST /api/location

| # | Test | What it checks |
|---|------|----------------|
| 1 | creates a location for an existing movie | Status 201, correct `title` and `coordinates` in response |
| 2 | returns 404 when movie does not exist | Invalid movie ID returns status 404 |

#### GET /api/location/:id

| # | Test | What it checks |
|---|------|----------------|
| 3 | returns a location by valid ID | Correct location document returned |
| 4 | returns 404 for a non-existent location ID | Non-existent ObjectId returns status 404 |

#### GET /api/location/movie/:movieId

| # | Test | What it checks |
|---|------|----------------|
| 5 | returns all locations for a movie | After adding 2 locations, response contains 2 items |
| 6 | returns 404 when movie does not exist | Invalid movie ID returns status 404 |

#### PUT /api/location/:id

| # | Test | What it checks |
|---|------|----------------|
| 7 | updates a location title and coordinates | New `title` and `coordinates` are persisted and returned |

#### DELETE /api/location/:id

| # | Test | What it checks |
|---|------|----------------|
| 8 | deletes a location and removes it from the movie | Status 200; subsequent GET returns 404 |

---

### Comments — `tests/comments.test.js` (5 tests)

#### POST /api/comments

| # | Test | What it checks |
|---|------|----------------|
| 1 | creates a comment for a valid user and movie | Status 201, `success: true`, comment text saved |
| 2 | returns 404 when user does not exist | Non-existent user ID returns status 404, `success: false` |
| 3 | returns 404 when movie does not exist | Non-existent movie ID returns status 404, `success: false` |

#### GET /api/comments/:movieId

| # | Test | What it checks |
|---|------|----------------|
| 4 | returns all comments for a movie | After 2 comments, response has 2 items with populated `user` field |
| 5 | returns 404 when movie does not exist | Non-existent movie ID returns status 404, `success: false` |

---

### User & Favorites — `tests/user.test.js` (17 tests)

#### GET /api/user/added

| # | Test | What it checks |
|---|------|----------------|
| 1 | returns movies added by the authenticated user | Movie added via POST /api/movie appears in added movies list |
| 2 | returns 401 when not authenticated | Request without token returns status 401 |

#### POST /api/user/favorites

| # | Test | What it checks |
|---|------|----------------|
| 3 | adds a movie to favorites | Status 201, favorite object has correct `type: 'movie'` |
| 4 | returns 400 when adding the same movie twice | Duplicate favorite returns status 400 |
| 5 | returns 400 for an invalid favorite type | Type outside enum `movie/hotel/route/attraction` returns status 400 |

#### GET /api/user/favorites

| # | Test | What it checks |
|---|------|----------------|
| 6 | returns favorites grouped by type | Response contains `movies`, `hotels`, `routes`, `attractions` keys; movie count is 1 |

#### DELETE /api/user/favorites/:favoriteId

| # | Test | What it checks |
|---|------|----------------|
| 7 | removes a favorite item | Status 200; favorites list is empty afterwards |
| 8 | returns 404 when favorite does not exist | Non-existent favorite ID returns status 404 |

#### GET /api/user/favorites/type/:type

| # | Test | What it checks |
|---|------|----------------|
| 9 | returns only favorites of the requested type | `?type=hotel` returns only hotel items |

#### Favorite Groups

| # | Test | What it checks |
|---|------|----------------|
| 10 | POST creates a group from existing favorites | Status 201, group name saved |
| 11 | POST returns 400 when name or items missing | Empty `itemIds` array returns status 400 |
| 12 | GET returns all groups | Group list contains created group with correct name |
| 13 | DELETE removes the group | Status 200 |
| 14 | PUT renames the group | Status 200, updated name in response |

---

### Performance — `tests/performance.test.js` (10 tests)

Response time thresholds: **FAST = 200 ms**, **READ = 500 ms**, **WRITE = 700 ms**

| # | Test | Endpoint | Threshold |
|---|------|----------|:---------:|
| 1 | GET /test responds within FAST_SLA | `GET /test` | 200 ms |
| 2 | GET /api/movie responds within READ_SLA | `GET /api/movie` | 500 ms |
| 3 | GET /api/movie/page responds within READ_SLA | `GET /api/movie/page` | 500 ms |
| 4 | GET /api/movie/search responds within READ_SLA | `GET /api/movie/search` | 500 ms |
| 5 | GET /api/movie/:id responds within READ_SLA | `GET /api/movie/:id` | 500 ms |
| 6 | POST /api/auth/register responds within WRITE_SLA | `POST /api/auth/register` | 700 ms |
| 7 | POST /api/auth/login responds within WRITE_SLA | `POST /api/auth/login` | 700 ms |
| 8 | POST /api/movie responds within WRITE_SLA | `POST /api/movie` | 700 ms |
| 9 | POST /api/location responds within WRITE_SLA | `POST /api/location` | 700 ms |
| 10 | GET /api/user/favorites responds within READ_SLA | `GET /api/user/favorites` | 500 ms |

---

## Frontend Tests

### App Routing — `src/App.test.js` (6 tests)

| # | Test | What it checks |
|---|------|----------------|
| 1 | App renders without crashing and shows the index page at / | `<App>` mounts and renders IndexPage at the root route |
| 2 | LoginPage renders its content | LoginPage component renders its content |
| 3 | SignupPage renders its content | SignupPage component renders its content |
| 4 | MoviesPage renders its content | MoviesPage component renders its content |
| 5 | ContactPage renders its content | ContactPage component renders its content |
| 6 | AboutPage renders its content | AboutPage component renders its content |

---

### Header Component — `src/__tests__/Header.test.js` (7 tests)

| # | Test | What it checks |
|---|------|----------------|
| 1 | renders the MovieMapUA logo link | Logo text is present in the header |
| 2 | renders the three main navigation links | "Про нас", "Зворотний зв'язок", "Фільми" links are rendered |
| 3 | search bar is hidden by default | Search input is not in the DOM on initial render |
| 4 | clicking the search icon reveals the search input | Click on search icon shows the input field |
| 5 | submitting an empty query does not navigate | Whitespace-only query does not trigger navigation; search bar stays open |
| 6 | user icon links to /login when no user is logged in | Unauthenticated state: user icon href is `/login` |
| 7 | user icon links to /profile when a user is logged in | Authenticated state: user icon href is `/profile` |