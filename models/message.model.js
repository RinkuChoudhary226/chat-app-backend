const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.ObjectId,
  },
  author_id: {
    type: mongoose.Schema.ObjectId,
  },
  message_type: {
    type: String, // 0 = text , 1 = image, 2 = video
  },
  message_body: {
    type: String, // if text and message and if image then file name
  },
  message_deleted: {
    type: String, // 0 = false , 1 = true
  },
  message_seen: {
    type: Map,
    of: String, // list of user who seen message
  },
}, {timestamps: {createdAt: 'createdAt', timezone: 'Asia/Calcutta'}});

const message = mongoose.model('message', messageSchema);

module.exports = message;
