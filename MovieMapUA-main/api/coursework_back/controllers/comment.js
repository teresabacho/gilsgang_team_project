const Comment = require('../models/Comment');
const User = require('../models/User');
const Movie = require('../models/Movie');

exports.createComment = async (req, res) => {
    const { user, movie, text } = req.body;

    try {
        const existingUser = await User.findById(user);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const existingMovie = await Movie.findById(movie);
        if (!existingMovie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        const comment = await Comment.create({ user, movie, text });
        return res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ success: false, message: 'Unable to create comment' });
    }
};

exports.getCommentsByMovie = async (req, res) => {
    const { movieId } = req.params;

    try {
        const existingMovie = await Movie.findById(movieId);
        if (!existingMovie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        const comments = await Comment.find({ movie: movieId }).populate('user', 'username');
        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error('Error getting comments by movie:', error);
        return res.status(500).json({ success: false, message: 'Unable to get comments' });
    }
};
