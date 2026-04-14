const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const authMiddleware = require('../../controllers/AuthMiddleware');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth middleware unit tests', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { cookies: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('без токена повертає помилку', async () => {
        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('з неправильним токеном повертає помилку', async () => {
        req.cookies.token = 'bad-token';

        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('з валідним токеном знаходить юзера і викликає next', async () => {
        req.cookies.token = 'good-token';

        jwt.verify.mockReturnValue({ id: '123' });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: '123', email: 'test@test.com' })
        });

        await authMiddleware(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('123');
        expect(req.user).toEqual({ _id: '123', email: 'test@test.com' });
        expect(next).toHaveBeenCalled();
    });
});