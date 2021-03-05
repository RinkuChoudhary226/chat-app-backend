//load model
const userModel = require("./../../models/user.model");
const ObjectId = require("mongodb").ObjectID;
const bcrypt = require("bcrypt");

const user = {
  list: async function (req, res) {
    // get all docs
    let sort_array = ["_id", "ASC"];
    let range = [0, 0];
    try {
      sort_array = JSON.parse(req.query.sort);
    } catch (error) {
      console.log("sort_array mising in user list");
    }
    try {
      range = JSON.parse(req.query.range);
    } catch (error) {
      console.log("range mising in user list");
    }
    console.log(req.query);
    var sort_key = sort_array[0];

    var sort = { [sort_key]: sort_array[1] == "DESC" ? -1 : 1 };

    let match = {
      role: "user",
    };
    if (req.params.id) {
      match = {
        _id: ObjectId(req.params.id),
      };
    }
    console.log(range);
    const users = await userModel.aggregate([
      {
        $match: match,
      },
      {
        $skip: range[0],
      },
      {
        $limit: range[1] + 1,
      },
      {
        $addFields: {
          profileImageSrc: {
            $concat: [
              "http://localhost:3001/uploads/profile/",
              "$profileImage",
            ],
          },
          id: "$_id",
        },
      },
      {
        $sort: sort,
      },
    ]);
    const users_count = await userModel.count([
      {
        $match: match,
      },
    ]);
    console.log(users_count);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");
    res.setHeader("Content-Range", users_count);
    if (users.length === 0 || users === undefined || users == null) {
      return res.status(404).send({
        statusCode: 404,
        content: {
          user: users,
        },
        message: "user not found.",
      });
    }

    return res.status(200).send({
      statusCode: 200,
      content: {
        users: users,
      },
      message: "success",
    });
  },

  create: async function (req, res) {
    const data = data;
    const users = await userModel.create(data);
    return res.json(users);
  },

  delete: async function (req, res) {
    // delete doc
    userModel
      .findByIdAndDelete(req.params.id)
      .then(function (result) {
        return res.json(result);
      })
      .catch((err) => {
        console.log(err);
      });
  },
};

module.exports = user;

module.exports.updateUsers = async function (req, res) {
  // console.log("request object");
  // console.log("**********************");
  // console.log(req);
  // console.log("**********************");
  const data = req.body;
  console.log("data object from the request.");
  console.log(data);
  if (Object.keys(data).length === 0 && data.constructor === Object) {
    return res.status(400).send({
      statusCode: 400,
      content: {
        user: users,
      },
      message: "Empty Request.",
    });
  }

  if (data) {
    var updatedUser = {};
    try {
      if (data.profileImage) updatedUser.profileImage = data.profileImage;
      if (data.userName) updatedUser.userName = data.userName;
      if (data.password) {
        updatedUser.password = bcrypt.hashSync(data.password, 10);
      }
      if (data.birthDate) updatedUser.birthDate = data.birthDate;
      if (data.email) updatedUser.email = data.email;
      if (data.isMentor) updatedUser.isMentor = data.isMentor;
      if (data.languages) updatedUser.languages = data.languages;
      if (data.experience) updatedUser.experience = data.experience;
      if (data.jobTitle) updatedUser.jobTitle = data.jobTitle;
      if (data.starRating <= 5) updatedUser.starRating = data.starRating;
      if (data.jobDescription) updatedUser.jobDescription = data.jobDescription;
      if (data.address) updatedUser.address = data.address;
      if (data.personal_state) updatedUser.personal_state = data.personal_state;
      if (data.personal_city) updatedUser.personal_city = data.personal_city;
      if (data.personal_country)
        updatedUser.personal_country = data.personal_country;
      if (data.personal_pincode)
        updatedUser.personal_pincode = data.personal_pincode;
      if (data.countryCode) updatedUser.countryCode = data.countryCode;
      if (data.mobile) updatedUser.mobile = data.mobile;
      if (data.currentOrganization)
        updatedUser.currentOrganization = data.currentOrganization;
      if (data.industriesWorkingIn)
        updatedUser.industriesWorkingIn = data.industriesWorkingIn;
      if (data.interestedTopics)
        updatedUser.interestedTopics = data.interestedTopics;
      if (data.education) updatedUser.education = data.education;
      if (data.reviews && typeof data.reviews == "object")
        updatedUser.reviews = data.reviews;
      if (data.socialLinks) updatedUser.socialLinks = data.socialLinks;
      if (data.skills) updatedUser.skills = data.skills;
      if (data.description) updatedUser.description = data.description;
      if (data.price) updatedUser.price = data.price;
      console.log("the data object after updating");
      console.log(updatedUser);
      console.log("Searching for records with ID ::: " + req.params.id);
      const users = await userModel.findByIdAndUpdate(
        req.params.id,
        updatedUser,
        {
          new: true,
        }
      );
      console.log("the list of users who got updated are");
      console.log(users);
      return res.status(200).send({
        statusCode: 200,
        content: {
          user: users,
        },
        message: "success",
      });
    } catch (err) {
      return res.status(400).send({
        statusCode: 400,
        message: err.message,
      });
    }
  }
};
