const { logout } = require('../../controllers/auth');

describe('Auth logout unit tests', () => {
    test('очищає cookie і повертає повідомлення', () => {
        const req = {};

        const res = {
            cookie: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        logout(req, res);

        expect(res.cookie).toHaveBeenCalledWith('token', '');
        expect(res.json).toHaveBeenCalledWith({
            message: 'Logged out successfully'
        });
    });
});