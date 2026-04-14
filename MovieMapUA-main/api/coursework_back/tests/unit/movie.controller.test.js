const Movie = require('../../models/Movie');
const { searchMoviesByTitle } = require('../../controllers/movie');

jest.mock('../../models/Movie');

describe('Movie controller unit tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = { query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    test('повертає 422 якщо title не передано', async () => {
        await searchMoviesByTitle(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalled();
    });

    test('повертає знайдені фільми', async () => {
        req.query.title = 'Harry';
        Movie.find.mockResolvedValue([{ title: 'Harry Potter' }]);

        await searchMoviesByTitle(req, res);

        expect(Movie.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
    });

    test('повертає 500 якщо база кидає помилку', async () => {
        req.query.title = 'Harry';
        Movie.find.mockRejectedValue(new Error('DB error'));

        await searchMoviesByTitle(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});