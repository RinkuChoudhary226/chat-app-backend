const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  conversation_type: {
    type: Number, // 0 = personal ,1 = group
  },
  members: {
    type: Array, // list of member
  },
  name: {
    type: String,
  },
}, {timestamps: {createdAt: 'createdAt', timezone: 'Asia/Calcutta'}});

const conversation = mongoose.model('conversation', conversationSchema);

module.exports = conversation;