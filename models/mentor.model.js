const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.ObjectId;

const mentorSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: 'users',
  },
  description: {
    type: String,
  },
  totalSessions: {
    type: Number,
    default: 0,
  },
  current_address: {
    type: Map,
    of: String,
  },
  original_address: {
    type: Map,
    of: String,
  },
  languages: {
    type: Array,
  },
  skills: {
    type: Array,
  },
  corporate_details: {
    type: Array,
  },
  education_details: {
    type: Array,
  },
  certificates: {
    type: Array,
  },
}, {timestamps: {createdAt: 'createdAt'}});

const mentor = mongoose.model('mentor', mentorSchema);

module.exports = mentor;
