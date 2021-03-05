var express = require("express");
const jwt = require("jsonwebtoken");
var router = express.Router();
const {
  loginValidationRules,
  signupValidationRules,
  validate,
} = require("./validator.js");
const passport = require("passport");
const multer = require("multer");
const userController = require("../controllers/admin/user.controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profile");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage: storage });

/* GET users listing. */

router.post(
  "/login",
  loginValidationRules(),
  validate,
  function (req, res, next) {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(404).send({
          statusCode: 404,
          content: [err],
          message: "Username & Password are incorrect",
        });
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          return res.status(404).send({
            statusCode: 404,
            content: [],
            message: "Username & Password are incorrect",
          });
        }
        if (user.role && user.role != "admin") {
          return res.status(404).send({
            statusCode: 404,
            content: [],
            message: "Username & Password are incorrect",
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
        return res.json({
          statusCode: 200,
          content: {
            token,
          },
          message: "success",
        });
      });
    })(req, res);
  }
);

//users create
router.get(
  "/users/:id?",
  passport.authenticate("jwt", { session: false }),
  userController.list
);
router.post(
  "/users",
  passport.authenticate("jwt", { session: false }),
  userController.create
);
router.put(
  "/users/:id",
  passport.authenticate("jwt", { session: false }),
  userController.updateUsers
);
router.delete(
  "/users/:id",
  passport.authenticate("jwt", { session: false }),
  userController.delete
);

module.exports = router;
