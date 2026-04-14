const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { login } = require('../../controllers/auth');

jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth controller unit tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@test.com',
                password: '123456'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn().mockReturnThis()
        };

        jest.clearAllMocks();
    });

    test('повертає 404 якщо користувача не знайдено', async () => {
        User.findOne.mockResolvedValue(null);

        await login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Користувача не знайдено!'
        });
    });

    test('повертає 400 якщо пароль неправильний', async () => {
        User.findOne.mockResolvedValue({
            _id: '1',
            email: 'test@test.com',
            password: 'hashed-password'
        });

        bcrypt.compareSync.mockReturnValue(false);

        await login(req, res);

        expect(bcrypt.compareSync).toHaveBeenCalledWith('123456', 'hashed-password');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Неправильний пароль або електронна пошта!'
        });
    });

    test('успішний логін ставить cookie і повертає користувача', async () => {
        const userDoc = {
            _id: '1',
            email: 'test@test.com',
            username: 'testuser',
            password: 'hashed-password'
        };

        User.findOne.mockResolvedValue(userDoc);
        bcrypt.compareSync.mockReturnValue(true);

        jwt.sign.mockImplementation((payload, secret, options, callback) => {
            callback(null, 'fake-token');
        });

        await login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
        expect(bcrypt.compareSync).toHaveBeenCalledWith('123456', 'hashed-password');
        expect(jwt.sign).toHaveBeenCalledWith(
            { email: 'test@test.com', id: '1' },
            process.env.JWT,
            {},
            expect.any(Function)
        );
        expect(res.cookie).toHaveBeenCalledWith(
            'token',
            'fake-token',
            { httpOnly: true }
        );
        expect(res.json).toHaveBeenCalledWith(userDoc);
    });

});