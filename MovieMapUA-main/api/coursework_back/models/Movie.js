const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    director: {
        type: String,
        required: true,
    },
    genre: {
        type: String,
        required: true,
    },
    posterUrl: {
        type: String,
        required: true,
    },

    locations: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const MovieModel = mongoose.model('Movie', movieSchema);
module.exports = MovieModel;