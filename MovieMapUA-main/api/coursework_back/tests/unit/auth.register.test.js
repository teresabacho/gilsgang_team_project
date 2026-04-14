const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { register } = require('../../controllers/auth');

jest.mock('../../models/User');
jest.mock('bcryptjs');

describe('Auth register unit tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                username: 'testuser',
                email: 'test@test.com',
                password: '123456'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    test('успішно реєструє користувача', async () => {
        bcrypt.hashSync.mockReturnValue('hashed-password');

        User.create.mockResolvedValue({
            _id: '1',
            username: 'testuser',
            email: 'test@test.com',
            password: 'hashed-password'
        });

        await register(req, res);

        expect(User.create).toHaveBeenCalledWith({
            username: 'testuser',
            email: 'test@test.com',
            password: 'hashed-password'
        });

        expect(res.json).toHaveBeenCalledWith({
            _id: '1',
            username: 'testuser',
            email: 'test@test.com',
            password: 'hashed-password'
        });
    });

    test('повертає 422 якщо сталася помилка', async () => {
        bcrypt.hashSync.mockReturnValue('hashed-password');
        User.create.mockRejectedValue(new Error('DB error'));

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalled();
    });
});