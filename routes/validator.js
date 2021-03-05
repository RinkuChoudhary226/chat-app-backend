const { body, validationResult } = require("express-validator");
const userModel = require("./../models/user.model");

const loginValidationRules = () => {
  return [
    // username must be an email
    body("email").isEmail().withMessage("Please enter valid Email"),
    // password must be at least 5 chars long
    body("password").isLength({ min: 5 }),
  ];
};

const signupValidationRules = () => {
  return [
    body("username")
      .isLength({ min: 5 })
      .bail()
      .custom(async (username) => {
        let users = await userModel.find({
          username,
        });
        if (users.length > 0) {
          //error
          throw new Error("Username is already taken");
        }
      }),
    body("email")
      .isEmail()
      .bail()
      .custom(async (email) => {
        let users = await userModel.find({
          email,
        });
        if (users.length > 0) {
          //error
          throw new Error("Email is already taken");
        }
      }),
    body("password").isLength({ min: 5 }),
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push(err.msg));
  return res.status(404).send({
    statusCode: 404,
    content: [],
    errors: extractedErrors.length > 0 ? extractedErrors[0] : "",
  });
};

module.exports = {
  loginValidationRules,
  signupValidationRules,
  validate,
};
