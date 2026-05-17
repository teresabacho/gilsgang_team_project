const express = require('express');
const {
    addMovie,
    getAllMovies,
    getMovieById,
    getMoviesByPage,
    searchMoviesByTitle,
    updateMovie,
    deleteMovie,
    getLatestMovies,
} = require("../controllers/movie");
const authMiddleware = require('../controllers/authMiddleware');

const router = express.Router();

router.get("/search", searchMoviesByTitle);
router.get("/", getAllMovies);
router.get("/page", getMoviesByPage);
router.get("/:id", getMovieById);
router.post("/", authMiddleware, addMovie);
router.put('/:id', authMiddleware, updateMovie);
router.delete('/:id', authMiddleware, deleteMovie);
router.get('/latest', getLatestMovies);

module.exports = router;
