const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const LocationSchema = new Schema({
    movie: {
        type: Schema.Types.ObjectId,
        ref: "Movie",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },

    coordinates: [{ type: Number, required: true }]

});



const LocationModel = mongoose.model('Location', LocationSchema);
module.exports = LocationModel;