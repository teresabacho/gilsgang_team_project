const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteItemSchema = new Schema({

    type: { type: String, required: true, enum: ['movie', 'hotel', 'route', 'attraction'] },

    movieId: { type: Schema.Types.ObjectId, ref: 'Movie' },

    externalId: String,


    name: String,
    location: {
        lat: Number,
        lng: Number
    },
    data: Schema.Types.Mixed
}, { timestamps: true });

const FavoriteGroupSchema = new Schema({
    name: { type: String, required: true },
    itemRefs: [Schema.Types.ObjectId]
}, { timestamps: true });

const UserSchema = new Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,

    favorites: [FavoriteItemSchema],
    favoriteGroups: [FavoriteGroupSchema],
    addedMovies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
