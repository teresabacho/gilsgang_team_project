const Movie = require("../models/Movie");
const User = require('../models/User');
const Location = require('../models/Location');
exports.addMovie = async (req, res) => {
    const { title, description, year, director, genre, posterUrl } = req.body;
    const userId = req.user._id;

    try {

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        const movie = new Movie({ title, description, year, director, genre, posterUrl, user: userId });
        await movie.save();

        user.addedMovies.push(movie._id);
        await user.save();

        return res.status(201).json({ movie });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Request Failed" });
    }
};
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find();
        return res.status(200).json(movies);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Request Failed" });
    }
};


exports.getMoviesByPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { year, genre } = req.query;

    try {
        const query = {};


        if (year) {
            query.year = year;
        }

        if (genre) {
            query.genre = new RegExp(genre, 'i');
        }

        const totalMovies = await Movie.countDocuments(query);
        const totalPages = Math.ceil(totalMovies / limit);

        const movies = await Movie.find(query).skip((page - 1) * limit).limit(limit);
        return res.status(200).json({ movies, totalPages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Request Failed" });
    }
};

exports.searchMoviesByTitle = async (req, res) => {
    const title = req.query.title;

    if (!title) {
        return res.status(422).json({ message: "Title query parameter is required" });
    }

    try {
        const movies = await Movie.find({ title: new RegExp(title, 'i') });
        return res.status(200).json({ movies });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Request Failed" });
    }
};


exports.updateMovie = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    try {
        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        if (movie.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updatedData = req.body;
        const updatedMovie = await Movie.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).json({ movie: updatedMovie });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.deleteMovie = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    try {
        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        if (movie.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await movie.deleteOne();
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getMovieById = async (req, res) => {
    const id = req.params.id;

    try {

        if (id === 'latest') {
            return exports.getLatestMovies(req, res);
        }

        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ message: "Invalid Movie ID" });
        }
        return res.status(200).json({ movie });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Request Failed" });
    }
};

    exports.getLatestMovies = async (req, res) => {
    const limit = 2;
    try {
        const movies = await Movie.find().sort({ year: -1 }).limit(limit);
        return res.status(200).json(movies);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Request Failed" });
    }
};