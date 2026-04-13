/**
 * Header component — usability-focused unit tests.
 *
 * Covers: navigation links, search toggle/submit, login/profile icon routing.
 */

// axios v1.x ships as ESM — mock with __esModule so the default import resolves.
jest.mock('axios', () => {
  const mock = {
    get: jest.fn(() => Promise.resolve({ data: null })),
    defaults: { baseURL: '', withCredentials: false },
  };
  return { __esModule: true, default: mock, ...mock };
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';

// useNavigate requires a router context — MemoryRouter provides it.
function renderHeader(user = null) {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{ user, setUser: jest.fn(), ready: true }}>
        <Header />
      </UserContext.Provider>
    </MemoryRouter>
  );
}

// ─── Brand / Navigation ───────────────────────────────────────────────────────

test('renders the MovieMapUA logo link', () => {
  renderHeader();
  expect(screen.getByText('MovieMapUA')).toBeInTheDocument();
});

test('renders the three main navigation links', () => {
  renderHeader();
  expect(screen.getByText('Про нас')).toBeInTheDocument();
  expect(screen.getByText(/Зворотний зв/)).toBeInTheDocument();
  expect(screen.getByText('Фільми')).toBeInTheDocument();
});

// ─── Search bar ───────────────────────────────────────────────────────────────

test('search bar is hidden by default', () => {
  renderHeader();
  expect(screen.queryByPlaceholderText(/Введіть/)).not.toBeInTheDocument();
});

test('clicking the search icon reveals the search input', () => {
  renderHeader();
  const searchIcon = document.querySelector('.icon-search');
  fireEvent.click(searchIcon);
  expect(screen.getByPlaceholderText(/Введіть Ваш пошуковий запит/)).toBeInTheDocument();
});

test('submitting an empty query does not navigate (input is trimmed)', () => {
  renderHeader();
  const searchIcon = document.querySelector('.icon-search');
  fireEvent.click(searchIcon);

  const input = screen.getByPlaceholderText(/Введіть Ваш пошуковий запит/);
  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.submit(input.closest('form'));

  // Search bar should still be visible because navigation was blocked
  expect(screen.getByPlaceholderText(/Введіть Ваш пошуковий запит/)).toBeInTheDocument();
});

// ─── Authentication icon routing ──────────────────────────────────────────────

test('user icon links to /login when no user is logged in', () => {
  renderHeader(null);
  const loginLink = document.querySelector('.icon-login a');
  expect(loginLink).toHaveAttribute('href', '/login');
});

test('user icon links to /profile when a user is logged in', () => {
  const user = { _id: '1', username: 'alice', email: 'alice@example.com' };
  renderHeader(user);
  const profileLink = document.querySelector('.icon-login a');
  expect(profileLink).toHaveAttribute('href', '/profile');
});