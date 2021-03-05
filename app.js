require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const passport = require("passport");
require("./passport");
const cors = require("cors");
const userModel = require("./models/user.model");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const apiRouter = require("./routes/api");
const backendRouter = require("./routes/backend");
const app = express();
const bcrypt = require("bcrypt");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", async () => {
  console.log("Connected to MongoDB @ 27017");
  let passwordHash = bcrypt.hashSync("12345678", 10);
  // add admin to database
  const admin = await userModel.find({ email: "admin@gmail.com" });

  if (admin.length > 0) {
    await userModel.updateOne(
      {
        email: "admin@gmail.com",
      },
      {
        email: "admin@gmail.com",
        password: passwordHash,
        role: "admin",
      }
    );
  } else {
    await userModel.create({
      email: "admin@gmail.com",
      password: passwordHash,
      role: "admin",
    });
  }
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(cors());

app.use(logger("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", apiRouter);
app.use("/backend", backendRouter);

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  console.log(_req.body);
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
