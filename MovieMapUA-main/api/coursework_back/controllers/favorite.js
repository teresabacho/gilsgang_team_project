const User = require('../models/User');



exports.addToFavorites = async (req, res) => {
    const userId = req.user._id;
    const { type, movieId, externalId, name, location, data } = req.body;

    if (!type || !['movie', 'hotel', 'route', 'attraction'].includes(type)) {
        return res.status(400).json({ error: 'Invalid or missing type' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const alreadyExists = user.favorites.some(fav => {
            if (type === 'movie') {
                return fav.type === 'movie' && fav.movieId?.toString() === movieId;
            }
            return fav.type === type && fav.externalId === externalId;
        });

        if (alreadyExists) {
            return res.status(409).json({ error: 'Item already in favorites' });
        }

        const newFavorite = {
            type,
            ...(type === 'movie' ? { movieId } : { externalId, name, location, data })
        };

        user.favorites.push(newFavorite);
        await user.save();

        const addedFavorite = user.favorites[user.favorites.length - 1];

        return res.status(200).json({
            message: 'Added to favorites',
            favorite: addedFavorite,
            favorites: user.favorites
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

exports.removeFromFavorites = async (req, res) => {
    const userId = req.user._id;
    const { type, movieId, externalId } = req.body;

    if (!type || !['movie', 'hotel', 'route', 'attraction'].includes(type)) {
        return res.status(400).json({ error: 'Invalid or missing type' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const removedFavorite = user.favorites.find(fav => {
            if (type === 'movie') {
                return fav.type === 'movie' && fav.movieId?.toString() === movieId;
            }
            return fav.type === type && fav.externalId === externalId;
        });

        user.favorites = user.favorites.filter(fav => {
            if (type === 'movie') {
                return !(fav.type === 'movie' && fav.movieId?.toString() === movieId);
            }
            return !(fav.type === type && fav.externalId === externalId);
        });

        await user.save();

        return res.status(200).json({
            message: 'Removed from favorites',
            removedFavorite,
            favorites: user.favorites
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};