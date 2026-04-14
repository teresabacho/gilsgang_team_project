const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment');

router.post('/', commentController.createComment);
router.get('/:movieId', commentController.getCommentsByMovie);


module.exports = router;
