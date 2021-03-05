//load model
const userModel = require("../models/user.model");
const chatUserModel = require("../models/chat_user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const https = require("http");
const axios = require("axios");
const querystring = require("querystring");
const fs = require("fs");
const request = require("request");
var download = function (uri, headers, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log("content-type:", res.headers["content-type"]);
    console.log("content-length:", res.headers["content-length"]);

    request(uri, {
      headers: {},
    })
      .pipe(fs.createWriteStream(filename))
      .on("close", callback);
  });
};
function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const auth = {
  signup: async function (req, res) {
    const files = req.files;

    const {
      username,
      email,
      password,
      price,
      languages,
      personal_city,
      personal_state,
      personal_country,
      personal_pincode,
      description,
      experience,
      education,
      certificate,
      reviews,
      socialLinks,
      isBlock,
      fullName,
      isMentor,
      skillSetStr,
      referral,
      countryCode,
      currentOrganization,
      starRating,
      industriesWorkingIn,
      interestedTopics,
      mobile,
      birthDate,
      address,
      jobTitle,
      jobDescription,
    } = req.body;
    const skills = skillSetStr ? skillSetStr.split(",") : undefined;
    let passwordHash = bcrypt.hashSync(password, 10);
    let profilePic;
    if (files && files.profilePhoto.length > 0) {
      profilePic = files.profilePhoto[0].filename;
    }
    let resume;
    // This is commented out for debugging. uncomment when running in prod.
    // if(files.resume && files.resume.length > 0){
    //     resume = files.resume[0].filename;
    // }
    resume = "/some/path";
    userModel
      .create({
        username,
        email: email,
        password: passwordHash,
        price,
        languages,
        personal_city,
        personal_state,
        personal_country,
        personal_pincode,
        description,
        experience,
        education,
        certificate,
        reviews,
        socialLinks,
        isBlock,
        profileImage: profilePic,
        isMentor: isMentor,
        skills,
        referral,
        countryCode,
        currentOrganization,
        starRating,
        industriesWorkingIn,
        interestedTopics,
        fullName,
        mobile,
        birthDate,
        address,
        jobTitle,
        jobDescription,
      })
      .then(async (user) => {
        const chatUser = chatUserModel({
          status: "offline",
          profile_pic: profilePic,
          userName: username,
          userId: user._id,
          _id: user._id,
        });
        chatUser.save();
        req.login(user, { session: false }, (err) => {
          if (err) {
            console.log("signup error", err);
            return res.status(404).send({
              statusCode: 404,
              content: [],
              message: "username & password are incorrect",
            });
          }
          // generate a signed son web token with the contents of user object and return it in the response
          const token = jwt.sign(
            {
              _id: user._id,
              username: user.username,
              email: user.email,
            },
            process.env.JWT_SECRET
          );
          const profileCompletionStatus = false;

          return res.status(200).send({
            statusCode: 200,
            content: {
              token,
              user,
              profileCompletionStatus,
            },
            message: "success",
          });
        });
      })
      .catch((error) => {
        return res.status(404).send({
          statusCode: 404,
          content: error,
          message: "Something got wrong",
        });
        // return res.json({
        //   statusCode: 404,
        //   content: [],
        //   message: "Something got wrong",
        // });
      });
  },
  socialLogin: function (req, res) {
    const code = req.body.access_token;
    //get access token first
    let access_token = "";
    let profileDataObj = {};
    return axios
      .post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        querystring.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: "http://localhost:3000/auth/linkdin",
          client_id: "86zhf799p5h626",
          client_secret: "6tNWX9K3Z3jjHoKi",
        })
      )
      .then((accessData) => {
        const responseData = accessData.data;
        access_token = responseData.access_token;
        return axios.get(
          "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
      })
      .then((profileResp) => {
        profile_pic_url =
          profileResp.data.profilePicture["displayImage~"].elements[3][
            "identifiers"
          ][0]["identifier"];

        profileDataObj.username =
          profileResp.data.firstName.localized.en_US +
          " " +
          profileResp.data.lastName.localized.en_US;
        profileDataObj.profileImage = makeid(5) + ".png";
        download(
          profile_pic_url,
          {
            Authorization: `Bearer ${access_token}`,
          },
          "./public/uploads/profile/" + profileDataObj.profileImage,
          function () {
            console.log("done");
          }
        );
        return axios.get(
          "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
      })
      .then((emailResp) => {
        const emailAddress = emailResp.data.elements[0]["handle~"].emailAddress;
        profileDataObj.email = emailAddress;
        console.log(profileDataObj);
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };
        return userModel
          .findOneAndUpdate(
            {
              email: profileDataObj.email,
            },
            profileDataObj,
            options
          )
          .then((user) => {
            const chatUser = chatUserModel({
              status: "offline",
              profile_pic: user.profileImage,
              userName: user.username,
              userId: user._id,
              _id: user._id,
            });
            chatUser.save();
            return req.login(user, { session: false }, (err) => {
              if (err) {
                return res.status(404).send({
                  statusCode: 404,
                  content: [],
                  message: "username & password are incorrect",
                });
              }
              // generate a signed son web token with the contents of user object and return it in the response
              const token = jwt.sign(
                {
                  _id: user._id,
                  username: user.username,
                  email: user.email,
                },
                process.env.JWT_SECRET
              );
              return res.json({
                statusCode: 200,
                content: {
                  token,
                  user,
                },
                message: "success",
              });
            });
          });
      })
      .catch((error) => {
        console.error(error);
      });
  },
  extractDataFromLinkdin: function (token, profiledata) {
    // console.log(profiledata);
    // const username = profiledata.localizedFirstName +' '+profiledata.localizedLastName;
    // const email = profiledata.localizedFirstName +'_'+profiledata.localizedLastName+'@linkdin.com';
    // const socialLogin = true;
    // const socialLoginObject = {
    //     type:'Linkdin',
    //     access_token:token
    // };
    // GET https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))
    // return {
    //     username,
    //     email,
    //     socialLogin,
    //     socialLoginObject,
    // }
  },
};

module.exports = auth;
