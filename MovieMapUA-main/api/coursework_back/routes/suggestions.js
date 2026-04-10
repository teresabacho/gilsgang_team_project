
const express = require('express');
const router = express.Router();
const { getTripadvisorSuggestions } = require('../controllers/suggestions');

router.get('/', getTripadvisorSuggestions);

module.exports = router;
