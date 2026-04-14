/* eslint-disable import/first */

jest.mock('axios', () => {
    const mock = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
        defaults: { baseURL: '', withCredentials: false },
    };
    return { __esModule: true, default: mock, ...mock };
});

jest.mock('../images/heart-filled.png', () => 'heart-filled.png');
jest.mock('../images/heart-empty.png', () => 'heart-empty.png');

import { render, screen } from '@testing-library/react';
import { UserContext } from '../context/UserContext';
import SuggestionCard from '../components/SuggestionCard';

describe('SuggestionCard tests', () => {
    const baseProps = {
        item: {
            location_id: '123',
            name: 'Test place',
            address_obj: {
                address_string: 'Lviv, Ukraine'
            },
            rating: '4.5',
            num_reviews: 10,
            web_url: 'https://example.com'
        },
        type: 'hotel',
        localFavorites: {},
        setLocalFavorites: jest.fn()
    };

    function renderCard(customProps = {}) {
        return render(
            <UserContext.Provider value={{ user: null, setUser: jest.fn(), ready: true }}>
                <SuggestionCard {...baseProps} {...customProps} />
            </UserContext.Provider>
        );
    }

    test('відображає назву', () => {
        renderCard();
        expect(screen.getByText(/test place/i)).toBeInTheDocument();
    });

    test('відображає адресу', () => {
        renderCard();
        expect(screen.getByText(/lviv, ukraine/i)).toBeInTheDocument();
    });

    test('відображає рейтинг', () => {
        renderCard();
        expect(screen.getByText(/рейтинг:/i)).toBeInTheDocument();
    });

    test('показує кнопку "Деталі" якщо є web_url', () => {
        renderCard();
        expect(screen.getByRole('button', { name: /деталі/i })).toBeInTheDocument();
    });

    test('показує "Посилання недоступне" якщо web_url нема', () => {
        renderCard({
            item: {
                ...baseProps.item,
                web_url: undefined
            }
        });

        expect(screen.getByText(/посилання недоступне/i)).toBeInTheDocument();
    });

    test('не падає якщо localFavorites порожній', () => {
        renderCard({ localFavorites: {} });
        expect(screen.getByText(/test place/i)).toBeInTheDocument();
    });
});
