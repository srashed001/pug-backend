"use strict";

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

// routers and middleware

const morgan = require("morgan");
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

// routes

// handle 404 errors
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

// generic error handler
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
