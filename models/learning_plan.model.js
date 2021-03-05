const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const learningPlanSchema = new mongoose.Schema(
  {
    learningPlanId: {
      type: mongoose.Schema.ObjectId,
    },
    userId: {
      type: ObjectId,
      ref: "users",
    },
    planName: {
      type: String,
      unique: true,
    },
    planDescription: {
      type: String,
    },
    milestones: [
      {
        name: { type: String },
        status: {
          type: String,
          enum: ["inprogress", "completed"],
        },
        description: {
          type: String,
        },
        startDate: {
          type: String,
          required: true,
        },
        endDate: {
          type: String,
          required: true,
        },
        isEnabled: {
          type: Boolean,
        },
      },
    ],
  },
  { timestamps: { createdAt: "createdAt" } }
);

const mentor = mongoose.model("mentor", learningPlanSchema);

module.exports = mentor;
