/**
 * App-level tests.
 *
 * Strategy:
 * - Mock UserContext so UserProvider makes no axios calls.
 * - Mock all page components so we only test routing/rendering, not page internals.
 * - App already contains its own <BrowserRouter> — do NOT wrap it in another router.
 * - Test individual page components directly in MemoryRouter for route-level checks.
 */

// App.js directly imports axios to set defaults — mock it so the ESM parse error
// doesn't blow up the test suite.
jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: { baseURL: '', withCredentials: false },
}));

// Mock the entire UserContext module — eliminates the axios.get(/api/profile) call
// that UserProvider triggers on mount.
jest.mock('./context/UserContext', () => {
  const React = require('react');
  const UserContext = React.createContext({ user: null, setUser: () => {}, ready: true });
  function UserProvider({ children }) {
    return (
      React.createElement(
        UserContext.Provider,
        { value: { user: null, setUser: () => {}, ready: true } },
        children
      )
    );
  }
  return { UserContext, UserProvider };
});

// Mock every page so tests stay lightweight (no Leaflet / Mapbox / network).
jest.mock('./pages/IndexPage',        () => () => <div>Index Page</div>);
jest.mock('./pages/LoginPage',        () => () => <div>Login Page</div>);
jest.mock('./pages/SignupPage',       () => () => <div>Signup Page</div>);
jest.mock('./pages/MoviesPage',       () => () => <div>Movies Page</div>);
jest.mock('./pages/SingleMoviePage',  () => () => <div>Single Movie Page</div>);
jest.mock('./pages/AccountPage',      () => () => <div>Account Page</div>);
jest.mock('./pages/SearchResultPage', () => () => <div>Search Result Page</div>);
jest.mock('./pages/EditMoviePage',    () => () => <div>Edit Movie Page</div>);
jest.mock('./pages/ContactPage',      () => () => <div>Contact Page</div>);
jest.mock('./pages/AboutPage',        () => () => <div>About Page</div>);
jest.mock('./pages/RoutesPage',       () => () => <div>Routes Page</div>);
jest.mock('./pages/FavoritesPage',    () => () => <div>Favorites Page</div>);
jest.mock('./pages/RouteDetailsPage', () => () => <div>Route Details Page</div>);

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import App from './App';

import LoginPage    from './pages/LoginPage';
import SignupPage   from './pages/SignupPage';
import MoviesPage   from './pages/MoviesPage';
import ContactPage  from './pages/ContactPage';
import AboutPage    from './pages/AboutPage';

const mockCtx = { user: null, setUser: jest.fn(), ready: true };

// ─── Full App at root route ───────────────────────────────────────────────────

test('App renders without crashing and shows the index page at /', () => {
  render(<App />);
  expect(screen.getByText('Index Page')).toBeInTheDocument();
});

// ─── Individual page components via MemoryRouter ──────────────────────────────
// Avoids nesting a second Router inside App while still verifying each page mounts.

function renderPage(Component) {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={mockCtx}>
        <Component />
      </UserContext.Provider>
    </MemoryRouter>
  );
}

test('LoginPage renders its content', () => {
  renderPage(LoginPage);
  expect(screen.getByText('Login Page')).toBeInTheDocument();
});

test('SignupPage renders its content', () => {
  renderPage(SignupPage);
  expect(screen.getByText('Signup Page')).toBeInTheDocument();
});

test('MoviesPage renders its content', () => {
  renderPage(MoviesPage);
  expect(screen.getByText('Movies Page')).toBeInTheDocument();
});

test('ContactPage renders its content', () => {
  renderPage(ContactPage);
  expect(screen.getByText('Contact Page')).toBeInTheDocument();
});

test('AboutPage renders its content', () => {
  renderPage(AboutPage);
  expect(screen.getByText('About Page')).toBeInTheDocument();
});