const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const userController = require("../controllers/user.controller");
const projectController = require("../controllers/project.controller");
const { body } = require("express-validator");

const router = express.Router();
const {
  loginValidationRules,
  signupValidationRules,
  validate,
} = require("./validator.js");
const authController = require("./../controllers/auth.controller");

// SET STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profile");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage: storage });

/*
Check if a string object is empty
*/

function empty(e) {
  switch (e) {
    case "":
    case " ":
    case 0:
    case "0":
    case null:
    case false:
    case typeof e == "undefined":
      return true;
    default:
      return false;
  }
}

/*
Check if an array is empty
*/
function checkIfObjectIsEmpty(obj) {
  if (Array.isArray(obj) && obj.length) {
    return false;
  }
  return true;
}

router.post(
  "/login",
  loginValidationRules(),
  validate,
  function (req, res, next) {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(404).send({
          statusCode: 404,
          content: [],
          message: "Username & Password are incorrect",
        });
      }
      req.login(user, { session: false }, (err) => {
        /*
            Code to check if the profile completion is yet to be done by user.
            */

        /*
                "Personal Details Screen: 
                not needed - address, age, pincode 
                mandatory - State, country, city 
                optional - DOB, Phonenumber, Profile photo 

                "Prof details screen:
                optinal - certification, education (not used for now).
                mandatory - JobTitle, jobDescription, Organisations and Industry working 
                Interested topics - mandatory for Mentee, optional for Mentor
                skills - optinal for Mentee, mandatory for Mentor.
            */

        let profileCompletionStatus = false;
        if (user.isMentor) {
          if (
            empty(user.personal_state) ||
            empty(user.personal_country) ||
            empty(user.personal_city) ||
            empty(user.jobTitle) ||
            empty(user.jobDescription) ||
            empty(user.currentOrganization) ||
            checkIfObjectIsEmpty(user.industriesWorkingIn) ||
            checkIfObjectIsEmpty(user.skills)
          ) {
            profileCompletionStatus = true;
          }
        } else {
          if (
            empty(user.personal_state) ||
            empty(user.personal_country) ||
            empty(user.personal_city) ||
            empty(user.jobTitle) ||
            empty(user.jobDescription) ||
            empty(user.currentOrganization) ||
            checkIfObjectIsEmpty(user.industriesWorkingIn) ||
            checkIfObjectIsEmpty(user.interestedTopics)
          ) {
            profileCompletionStatus = true;
          }
        }

        if (err) {
          console.log(err);
          return res.status(404).send({
            statusCode: 404,
            content: [],
            message: "Username & Password are incorrect",
          });
        }
        if (user.isBlock) {
          return res.status(404).send({
            statusCode: 404,
            content: [],
            message: "Your account is blocked",
          });
        }

        const token = jwt.sign(
          {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
          process.env.JWT_SECRET
        );
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
    })(req, res);
  }
);

router.post(
  "/signup",
  upload.fields([
    {
      name: "profilePhoto",
      maxCount: 1,
    },
    {
      name: "resume",
      maxCount: 1,
    },
  ]),
  signupValidationRules(),
  validate,
  authController.signup
);

router.post(
  "/socialLogin",
  [
    body("access_token")
      .isLength({ min: 10 })
      .withMessage("access token is not valid"),
  ],
  validate,
  authController.socialLogin
);

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  userController.profile
);

router.post(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  upload.single("profilePhoto"),
  userController.profileUpdate
);

router.get("/getAllMentor", userController.getAllMentor);

router.get(
  "/mentor/:id",
  passport.authenticate("jwt", { session: false }),
  userController.getMentor
);

// project apis
router.get(
  "/projects/:id?",
  passport.authenticate("jwt", { session: false }),
  projectController.getProject
);

// get projects by userid
router.get(
  "/projects/users/:id?",
  passport.authenticate("jwt", { session: false }),
  projectController.getProjectByUserId
);

//find project by skills
router.post(
  "/projects/skills",
  passport.authenticate("jwt", { session: false }),
  projectController.findProjectsBySkillsLanguagesRatingsTopicsAndIfValid
);

router.post(
  "/projects",
  passport.authenticate("jwt", { session: false }),
  projectController.create
);

router.put(
  "/projects/:id",
  passport.authenticate("jwt", { session: false }),
  projectController.updateProject
);

router.delete(
  "/projects",
  passport.authenticate("jwt", { session: false }),
  projectController.delete
);

module.exports = router;
