const projectModel = require("./../models/project.model");
const moment = require("moment");

//create a project
module.exports.create = async function (req, res) {
  const project = req.body;
  if (Object.keys(project).length === 0 && project.constructor === Object) {
    return res.status(400).send({
      statusCode: 400,
      message: "Cannot create an empty Request.",
    });
  }

  try {
    const projectRecord = await projectModel.create(project);
    return res.status(200).send({
      statusCode: 200,
      content: {
        project: projectRecord,
      },
      message: "project successfully created",
    });
  } catch (err) {
    return res.status(400).send({
      statusCode: 400,
      message: err.message,
    });
  }
};

// update a project
module.exports.updateProject = async function (req, res) {
  console.log("This is the request body for project.");
  var currentProject = req.body;
  console.log(currentProject);
  if (
    Object.keys(currentProject).length === 0 &&
    currentProject.constructor === Object
  ) {
    return res.status(400).send({
      statusCode: 400,
      message: "Empty Request.",
    });
  }

  if (currentProject) {
    delete currentProject.id;
    delete currentProject._id;
    if (req.body.projectTitle)
      currentProject.projectTitle = req.body.projectTitle;
    if (req.body.projectDescription)
      currentProject.projectDescription = req.body.projectDescription;
    if (req.body.level) currentProject.level = req.body.level;
    if (req.body.prerequisites)
      currentProject.prerequisites = req.body.prerequisites;
    if (req.body.skills) currentProject.skills = req.body.skills;
    if (req.body.reviews && typeof req.body.reviews == "object")
      currentProject.reviews = req.body.reviews;
    //Ths is still pending
    //maximumAllowedParticipants
    //registeredUsers
    if (req.body.category) currentProject.category = req.body.category;
    if (req.body.medium) currentProject.medium = req.body.medium;
    if (req.body.projectResources)
      currentProject.projectResources = req.body.projectResources;
    if (req.body.stars <= 5) currentProject.stars = req.body.stars;
    if (req.body.projectStartDate)
      currentProject.projectStartDate = req.body.projectStartDate;
    if (req.body.projectEndDate)
      currentProject.projectStartDate = req.body.projectEndDate;
    if (req.body.isEnabled) currentProject.isEnabled = req.body.isEnabled;
    if (req.body.maximumAllowedParticipants)
      currentProject.maximumAllowedParticipants =
        req.body.maximumAllowedParticipants;
    if (
      req.body.registeredUsers.length <= req.body.maximumAllowedParticipants
    ) {
      currentProject.registeredUsers = req.body.registeredUsers;
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: "cannot register user. limit exceeded.",
      });
    }

    try {
      const project = await projectModel.findByIdAndUpdate(
        req.params.id,
        currentProject,
        {
          new: true,
        }
      );
      return res.status(200).send({
        statusCode: 200,
        content: {
          project: currentProject,
        },
        message: "success",
      });
    } catch (err) {
      return res.status(400).send({
        statusCode: 400,
        content: {
          project: currentProject,
        },
        message: err.message,
      });
    }
  }
};

// find all projects by valid date or projects in progress when enabled and show disabled projects so that
// mentor can re-enable

module.exports.findProjectsBySkillsLanguagesRatingsTopicsAndIfValid = async function (
  req,
  res
) {
  var _topics = req.body.topics;
  var _languages = req.body.languages;
  var _stars = req.body.stars;
  var _categories = req.body.categories;
  try {
    projectModel
      .find({
        $or: [
          {
            categories: { $in: _categories },
          },
        ],
        $or: [
          {
            languages: { $in: _languages },
          },
        ],
        $or: [
          {
            stars: { $gte: _stars },
          },
        ],
        $or: [
          {
            topics: { $in: _topics },
          },
        ],
        $and: [{ projectEndDate: { $gte: moment().valueOf() } }],
      })
      .then(function (result) {
        if (Object.keys(result).length === 0 && result.constructor === Object) {
          return res.status(400).send({
            statusCode: 400,
            message: "cannot serve empty Request.",
          });
        } else {
          return res.status(200).send({
            statusCode: 200,
            content: result,
            message: "success",
          });
        }
      });
  } catch (err) {
    return res.status(400).send({
      statusCode: 400,
      message: err.message,
    });
  }
};

// find a specific project by id
module.exports.getProject = async function (req, res) {
  try {
    const project = await projectModel.find({
      _id: req.params.id,
    });

    if (project) {
      return res.status(200).send({
        statusCode: 200,
        content: project,
        message: "success",
      });
    }
  } catch (err) {
    return res.status(400).send({
      statusCode: 400,
      message: err.message,
    });
  }
};

// find a all project by userid
module.exports.getProjectByUserId = async function (req, res) {
  try {
    const project = await projectModel.find({
      userId: req.params.id,
    });

    if (project) {
      return res.status(200).send({
        statusCode: 200,
        content: project,
        message: "success",
      });
    }
  } catch (err) {
    return res.status(400).send({
      statusCode: 400,
      message: err.message,
    });
  }
};

// delete a project
// delete projects only if the projects has no participants
module.exports.delete = async function (req, res) {
  const project = req.body;
  const registeredUsers = req.body.registeredUsers;
  const endDate = req.body.projectEndDate;

  if (Object.keys(project).length === 0 && project.constructor === Object) {
    return res.status(400).send({
      statusCode: 400,
      content: {
        user: users,
      },
      message: "Cannot delete an empty Request.",
    });
  }
  console.log("checking for date");
  console.log(endDate > moment().toISOString());
  if (registeredUsers.length === 0 && endDate > moment().toISOString()) {
    const projectRecord = await projectModel.findOneAndDelete({
      _id: project._id,
    });
    return res.status(200).send({
      statusCode: 200,
      content: {
        project: projectRecord,
      },
      message: "project successfully deleted.",
    });
  } else {
    return res.status(400).send({
      statusCode: 400,
      message: "cannot delete project in progress.",
    });
  }
};
