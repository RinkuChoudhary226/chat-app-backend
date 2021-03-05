const mongoose = require("mongoose");
// use the users currentTimeZone to identify the timestamp and then insert.
const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.ObjectId,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
    },
    projectTitle: {
      type: String,
      unique: true,
      required: true,
    },
    projectDescription: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    prerequisites: {
      type: String,
      required: true,
    },
    topics: {
      type: Array,
      of: String,
      required: true,
    },
    categories: {
      type: Array,
      of: String,
      required: true,
    },
    languages: {
      type: Array,
      of: String,
      required: true,
    },
    projectResources: {
      type: Array,
      of: String,
    },
    stars: {
      type: Number,
    },
    projectStartDate: {
      type: String,
      required: true,
    },
    projectEndDate: {
      type: String,
      required: true,
    },
    maximumAllowedParticipants: {
      type: Number,
      required: true,
    },
    registeredUsers: {
      type: Array,
      of: mongoose.Schema.ObjectId,
    },
    reviews: {
      type: Array,
      of: String,
    },
    isEnabled: {
      type: Boolean,
    },
  },
  { timestamps: { createdAt: "createdAt" } }
);

const project = mongoose.model("project", projectSchema);

module.exports = project;
