const User = require("../models/User");
const Movie = require('../models/Movie');
const bcrypt = require('bcryptjs');


exports.getAddedMovies = async (req, res, next) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).populate('addedMovies');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        res.status(200).json(user.addedMovies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.editProfile = async (req, res) => {
    const userId = req.user._id;
    const { username, email, currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Поточний пароль введено неправильно' });
        }

        user.username = username || user.username;
        user.email = email || user.email;
        if (newPassword) {
            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();
        res.status(200).json({ message: 'Профіль успішно оновлено', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllFavorites = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).populate('favorites.movieId');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const favoritesByType = {
            movies: [],
            hotels: [],
            routes: [],
            attractions: []
        };

        user.favorites.forEach(item => {
            if (item.type === 'movie') {
                favoritesByType.movies.push({
                    _id: item.movieId?._id,
                    favoriteId: item._id,
                    movieId: item.movieId?._id,
                    type: item.type,
                    title: item.movieId?.title || item.name,
                    posterUrl: item.movieId?.posterUrl,
                    year: item.movieId?.year,
                    director: item.movieId?.director,
                    genre: item.movieId?.genre,
                    createdAt: item.createdAt
                });
            } else {
                favoritesByType[item.type + 's'].push({
                    _id: item._id,
                    favoriteId: item._id,
                    type: item.type,
                    externalId: item.externalId,
                    name: item.name,
                    location: item.location,
                    data: item.data,
                    createdAt: item.createdAt
                });
            }
        });

        res.status(200).json(favoritesByType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getFavoriteById = async (req, res) => {
    const userId = req.user._id;
    const { favoriteId } = req.params;

    try {
        const user = await User.findById(userId).populate('favorites.movieId');
        if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

        const favorite = user.favorites.find(fav => fav._id.toString() === favoriteId);
        if (!favorite) return res.status(404).json({ error: 'Обране не знайдено' });

        res.status(200).json({ favorite });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Помилка сервера' });
    }
};


exports.getFavoritesByType = async (req, res) => {
    const userId = req.user._id;
    const { type } = req.params;

    try {
        const user = await User.findById(userId).populate('favorites.movieId');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const filteredFavorites = user.favorites.filter(item => item.type === type);

        const formattedFavorites = filteredFavorites.map(item => {
            if (item.type === 'movie') {
                return {
                    _id: item.movieId?._id,
                    favoriteId: item._id,
                    movieId: item.movieId?._id,
                    type: item.type,
                    title: item.movieId?.title || item.name,
                    posterUrl: item.movieId?.posterUrl,
                    year: item.movieId?.year,
                    director: item.movieId?.director,
                    genre: item.movieId?.genre,
                    createdAt: item.createdAt
                };
            } else {
                return {
                    _id: item._id,
                    favoriteId: item._id,
                    type: item.type,
                    externalId: item.externalId,
                    name: item.name,
                    location: item.location,
                    data: item.data,
                    createdAt: item.createdAt
                };
            }
        });

        res.status(200).json(formattedFavorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.addToFavorites = async (req, res) => {
    const userId = req.user._id;
    const { type, movieId, externalId, name, location, data } = req.body;

    if (!type || !['movie', 'hotel', 'route', 'attraction'].includes(type)) {
        return res.status(400).json({ error: 'Невірний тип елемента' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const existingFavorite = user.favorites.find(item => {
            if (type === 'movie') {
                return item.type === type && item.movieId && item.movieId.toString() === movieId;
            } else {
                return item.type === type && item.externalId === externalId;
            }
        });

        if (existingFavorite) {
            return res.status(400).json({ error: 'Елемент вже додано до обраних' });
        }

        const newFavorite = {
            type,
            name,
            location,
            data
        };

        if (type === 'movie') {
            newFavorite.movieId = movieId;
        } else {
            newFavorite.externalId = externalId;
        }

        user.favorites.push(newFavorite);
        await user.save();

        res.status(201).json({ message: 'Елемент додано до обраних', favorite: newFavorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.removeFromFavorites = async (req, res) => {
    const userId = req.user._id;
    const { favoriteId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const favoriteIndex = user.favorites.findIndex(item => item._id.toString() === favoriteId);
        if (favoriteIndex === -1) {
            return res.status(404).json({ error: 'Елемент не знайдено в обраних' });
        }

        user.favorites.splice(favoriteIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Елемент видалено з обраних' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createFavoriteGroup = async (req, res) => {
    const userId = req.user._id;
    const { name, itemIds } = req.body;

    if (!name || !itemIds || itemIds.length === 0) {
        return res.status(400).json({ error: 'Назва групи та елементи обов\'язкові' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }


        const validItemIds = itemIds.filter(itemId =>
            user.favorites.some(fav => fav._id.toString() === itemId)
        );

        if (validItemIds.length === 0) {
            return res.status(400).json({ error: 'Не знайдено жодного валідного елемента' });
        }

        const newGroup = {
            name,
            itemRefs: validItemIds
        };

        user.favoriteGroups.push(newGroup);
        await user.save();

        res.status(201).json({ message: 'Група успішно створена', group: newGroup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getFavoriteGroups = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).populate('favorites.movieId');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }


        const groupsWithDetails = user.favoriteGroups.map(group => {
            const items = group.itemRefs.map(itemId => {
                const favoriteItem = user.favorites.find(fav => fav._id.toString() === itemId.toString());
                if (!favoriteItem) return null;

                if (favoriteItem.type === 'movie') {
                    return {
                        _id: favoriteItem.movieId?._id,
                        favoriteId: favoriteItem._id,
                        movieId: favoriteItem.movieId?._id,
                        type: favoriteItem.type,
                        name: favoriteItem.movieId?.title || favoriteItem.name,
                        title: favoriteItem.movieId?.title,
                        posterUrl: favoriteItem.movieId?.posterUrl,
                        year: favoriteItem.movieId?.year,
                        director: favoriteItem.movieId?.director,
                        genre: favoriteItem.movieId?.genre
                    };
                } else {
                    return {
                        _id: favoriteItem._id,
                        favoriteId: favoriteItem._id,
                        type: favoriteItem.type,
                        name: favoriteItem.name,
                        externalId: favoriteItem.externalId,
                        location: favoriteItem.location,
                        data: favoriteItem.data
                    };
                }
            }).filter(item => item !== null);

            return {
                _id: group._id,
                name: group.name,
                items,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            };
        });

        res.status(200).json(groupsWithDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.deleteFavoriteGroup = async (req, res) => {
    const userId = req.user._id;
    const { groupId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const groupIndex = user.favoriteGroups.findIndex(group => group._id.toString() === groupId);
        if (groupIndex === -1) {
            return res.status(404).json({ error: 'Група не знайдена' });
        }

        user.favoriteGroups.splice(groupIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Група успішно видалена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateFavoriteGroup = async (req, res) => {
    const userId = req.user._id;
    const { groupId } = req.params;
    const { name, itemIds } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const group = user.favoriteGroups.find(group => group._id.toString() === groupId);
        if (!group) {
            return res.status(404).json({ error: 'Група не знайдена' });
        }

        if (name) {
            group.name = name;
        }

        if (itemIds) {
            const validItemIds = itemIds.filter(itemId =>
                user.favorites.some(fav => fav._id.toString() === itemId)
            );
            group.itemRefs = validItemIds;
        }

        await user.save();
        res.status(200).json({ message: 'Група успішно оновлена', group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};