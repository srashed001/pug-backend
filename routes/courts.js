"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");

const {
  ensureHostOrAdmin,
  ensureCorrectUserOrAdmin,
  ensureAuthDeleteComment,
  ensureLoggedIn,
} = require("../middleware/auth");
const Court = require("../models/court");

const router = express.Router();


/** GET / => { games: [ {id, title, date, time, city, state, createdBy, players, daysDiff, isActive}, ...]}
 * Can provide search filters in request body
 *  - date {string}
 *  - city {string}
 *  - state {string} - all cap 2 letter abbreviation
 *  - host {string} username
 *  - joined {string} usernamejes
 *  - isActive {boolean}
 *  - gameStatus {string} 'pending' || 'resolved'
 *
 * Authorization required: none
 *
 */
router.get("/", async function (req, res, next) {
  const q = req.query;
  try {
    // const validator = jsonschema.validate(q, gameSearchSchema);
    // if (!validator.valid) {
    //   const errs = validator.errors.map((e) => e.stack);
    //   throw new BadRequestError(errs);
    // }

    const courts = await Court.get(q);
    return res.json({ courts });
  } catch (err) {
    return next(err);
  }
});



module.exports = router;
