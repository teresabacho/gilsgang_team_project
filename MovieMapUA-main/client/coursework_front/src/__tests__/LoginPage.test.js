/* eslint-disable import/first */

jest.mock('axios', () => {
    const mock = {
        post: jest.fn(),
        get: jest.fn(),
        defaults: { baseURL: '', withCredentials: false },
    };
    return { __esModule: true, default: mock, ...mock };
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import LoginPage from '../pages/LoginPage';
import { UserContext } from '../context/UserContext';

describe('LoginPage tests', () => {
    test('показує помилку при неправильному логіні', async () => {
        axios.post.mockRejectedValue({
            response: {
                data: { error: 'Неправильний пароль або електронна пошта!' }
            }
        });

        render(
            <BrowserRouter>
                <UserContext.Provider value={{ setUser: jest.fn(), user: null, ready: true }}>
                    <LoginPage />
                </UserContext.Provider>
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/електронна пошта/i), {
            target: { value: 'test@test.com' }
        });

        fireEvent.change(screen.getByPlaceholderText(/пароль/i), {
            target: { value: '123456' }
        });

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText(/неправильний пароль/i)).toBeInTheDocument();
        });
    });

    test('викликає axios.post після submit', async () => {
        axios.post.mockResolvedValue({
            data: { _id: '1', username: 'Test' }
        });

        const setUser = jest.fn();

        render(
            <BrowserRouter>
                <UserContext.Provider value={{ setUser, user: null, ready: true }}>
                    <LoginPage />
                </UserContext.Provider>
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/електронна пошта/i), {
            target: { value: 'test@test.com' }
        });

        fireEvent.change(screen.getByPlaceholderText(/пароль/i), {
            target: { value: '123456' }
        });

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
        });
    });
});