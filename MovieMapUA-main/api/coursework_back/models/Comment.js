const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const CommentModel = mongoose.model('Comment', commentSchema);
module.exports = CommentModel;
