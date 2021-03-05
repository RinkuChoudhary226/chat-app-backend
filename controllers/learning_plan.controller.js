const learningPlanModel = require("./../models/learning_plan.model");
const moment = require("moment");

module.exports.create = async function (req, res) {
  const lp = req.body;
  if (Object.keys(project).length === 0 && project.constructor === Object) {
    return res.status(400).send({
      statusCode: 400,
      message: "Cannot create an empty Request.",
    });
  }

  try {
    const lpRecord = await learningPlanModel.create(lp);
    return res.status(200).send({
      statusCode: 200,
      content: {
        learningPlan: lp,
      },
      message: "learning plan successfully created",
    });
  } catch (err) {
    return res.status(400).send({
      statusCode: 400,
      message: err.message,
    });
  }
};

// update a learning plan
module.exports.updatelp = async function (req, res) {
  console.log("This is the request body for lp.");
  var currentLP = req.body;
  console.log(currentLP);
  if (Object.keys(currentLP).length === 0 && currentLP.constructor === Object) {
    return res.status(400).send({
      statusCode: 400,
      message: "Empty Request.",
    });
  }
  // pending
};
