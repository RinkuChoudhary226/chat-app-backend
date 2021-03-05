//load model
const userModel = require("./../models/user.model");
const bcrypt = require("bcrypt");

const user = {
  profile: function (req, res) {
    return res.status(200).send({
      statusCode: 200,
      content: req.user,
      message: "success",
    });
  },
  profileUpdate: async function (req, res) {
    console.log("request inside profile update.");
    const {
      userName,
      email,
      price,
      password,
      description,
      isMentor,
      languages,
      experience,
      education,
      jobTitle,
      starRating,
      jobDescription,
      address,
      personal_state,
      personal_city,
      personal_country,
      personal_pincode,
      countryCode,
      mobile,
      currentOrganization,
      industriesWorkingIn,
      interestedTopics,
      profileImage,
      //certificate,
      //price,
      birthDate,
      reviews,
      socialLinks,
      skills,
    } = req.body;
    console.log(req.body);
    //update another filed and push array in array fileds
    const user = await userModel.findById(req.user.id);
    if (birthDate) user.birthDate = birthDate;
    if (userName) user.userName = userName;
    if (email) user.email = email;
    //if(price) user.price = price;
    if (password) user.password = password;
    if (profileImage) user.profileImage = profileImage;
    if (isMentor) user.isMentor = isMentor;
    console.log(languages);
    if (languages) user.languages = languages.split(",");
    if (experience) user.experience = experience;
    if (jobTitle) user.jobTitle = JSON.parse(jobTitle);
    if (starRating <= 5) user.starRating = starRating;
    if (jobDescription) user.jobDescription = jobDescription;
    if (address) user.address = address;
    if (personal_state) user.personal_state = personal_state;
    if (personal_city) user.personal_city = personal_city;
    if (personal_country) user.personal_country = personal_country;
    if (personal_pincode) user.personal_pincode = personal_pincode;
    if (countryCode) user.countryCode = countryCode;
    if (mobile) user.mobile = mobile;
    if (currentOrganization) user.currentOrganization = currentOrganization;
    if (industriesWorkingIn)
      user.industriesWorkingIn = industriesWorkingIn.split(",");
    if (interestedTopics) user.interestedTopics = interestedTopics.split(",");
    if (education) user.education = JSON.parse(education);
    //if(certificate) user.certificate = JSON.parse(certificate);
    if (reviews && typeof reviews == "object") user.reviews = reviews;
    if (socialLinks) user.socialLinks = socialLinks;
    if (skills) user.skills = skills.split(",");
    if (description) user.description = description;
    if (price) user.price = price;
    await user.save();

    return res.status(200).send({
      statusCode: 200,
      content: {
        user: await userModel.findById(req.user.id),
      },
      message: "success",
    });
  },
  getAllMentor: function (req, res) {
    // get all active
    userModel
      .find({
        isMentor: true,
      })
      .then(function (result) {
        return res.status(200).send({
          statusCode: 200,
          content: result,
          message: "success",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  getMentor: async function (req, res) {
    // let response = [];
    let dbResponse = await userModel
      .find({
        _id: req.params.id,
        isMentor: true,
        isBlock: false,
      })
      .catch((err) => {
        console.log(err);
      });
    console.log("this is the mentor returned by getMentor");
    console.log(dbResponse);
    delete dbResponse.password;
    // dbResponse.map((doc) => {
    //   console.log(doc);
    //   let tempResponse = {
    //     profileImage: doc.profileImage,
    //     username: doc.username,
    //     email: doc.email,
    //     fullName: doc.fullName,
    //     languages: doc.languages,
    //     experience: doc.experience,
    //     education: doc.education,
    //     reviews: doc.reviews,
    //     skills: doc.skills,
    //     industriesWorkingIn: doc.industriesWorkingIn,
    //     interestedTopics: doc.interestedTopics,
    //     jobTitle: doc.jobTitle,
    //     jobDescription: doc.jobDescription,
    //     createdAt: doc.createdAt,
    //   };

    //   response.push(tempResponse);
    // });

    return res.status(200).send({
      statusCode: 200,
      content: dbResponse,
      message: "success",
    });

    // userModel.find({
    //     _id:req.params.id,
    // }).then(function (result) {

    //     return res.json({
    //         statusCode:200,
    //         content:result,
    //         message:'success'
    //     });
    // }).catch((err)=>{
    //     console.log(err);
    // });
  },
};

module.exports = user;
