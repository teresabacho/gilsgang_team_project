const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const authMiddleware = require('../controllers/authMiddleware');



router.get('/added', authMiddleware, userController.getAddedMovies);
router.post('/edit-profile', authMiddleware, userController.editProfile);

router.get('/favorites', authMiddleware, userController.getAllFavorites);

router.post('/favorites', authMiddleware, userController.addToFavorites);
router.delete('/favorites/:favoriteId', authMiddleware, userController.removeFromFavorites);
router.get('/favorites/item/:favoriteId', authMiddleware, userController.getFavoriteById);
router.get('/favorites/type/:type', authMiddleware, userController.getFavoritesByType);

router.post('/favorites', authMiddleware, userController.addToFavorites);
router.delete('/favorites/:favoriteId', authMiddleware, userController.removeFromFavorites);

router.post('/favorite-groups', authMiddleware, userController.createFavoriteGroup);
router.get('/favorite-groups', authMiddleware, userController.getFavoriteGroups);
router.delete('/favorite-groups/:groupId', authMiddleware, userController.deleteFavoriteGroup);
router.put('/favorite-groups/:groupId', authMiddleware, userController.updateFavoriteGroup);

module.exports = router;