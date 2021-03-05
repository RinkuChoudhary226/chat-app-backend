const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    userName: {
        type: String,
    },
    profile_pic: {
        type: String,
    },
    socketId: {
        type: Array,
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
    },
}, { timestamps: { createdAt: 'createdAt' } });

const user = mongoose.model('user_chat', userSchema);

module.exports = user;