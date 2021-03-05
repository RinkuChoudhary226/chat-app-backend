// Mongoose schema and model definitions
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create the schema for the Account database
const userSchema = new Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
    },
    password: {
      type: String,
    },
    token: {
      type: String,
    },
    isMentor: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: "default.png",
    },
    currentTimeZone: {
      type: String,
    },
    languages: {
      type: Array,
    },
    personal_city: {
      type: String,
    },
    personal_state: {
      type: String,
    },
    personal_country: {
      type: String,
    },
    personal_pincode: {
      type: String,
    },
    description: {
      type: String,
    },
    experience: {
      type: Number,
    },
    education: {
      type: Array,
    },
    certificate: {
      type: Array,
    },
    reviews: {
      type: Array,
    },
    socialLinks: {
      type: Array,
    },
    skills: {
      type: Array,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    socialLogin: {
      type: Boolean,
      default: false,
    },
    socialLoginObject: {
      type: Object,
      default: {},
    },
    referral: {
      type: Boolean,
      default: false,
    },
    fullName: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    mobile: {
      type: String,
    },
    birthDate: {
      type: String,
    },
    address: {
      type: String,
    },
    jobTitle: {
      type: String,
    },
    jobDescription: {
      type: String,
    },
    currentOrganization: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    starRating: {
      type: Number,
    },
    industriesWorkingIn: {
      type: Array,
    },
    interestedTopics: {
      type: Array,
    },
  },
  { timestamps: true }
);

const user = mongoose.model("user", userSchema);
module.exports = user;
