const express = require('express');
const router = express.Router();
const authMiddleware = require('../controllers/authMiddleware');
const {
    addToFavorites,
    removeFromFavorites
} = require('../controllers/favorite');

router.post('/add', authMiddleware, addToFavorites);
router.delete('/remove', authMiddleware, removeFromFavorites);

module.exports = router;
