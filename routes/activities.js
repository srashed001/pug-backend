"use strict";

const express = require("express");

const {
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");
const Activity = require("../models/activity");

const router = express.Router();


/** GET /[username] => {activity, myActivity}
 * Where activity/myActivity = [{primaryUser, secondaryUser, game, data, opertaion, stamp}, ...]
 *
 *
 * Authorization required: admin or same-user-as-:username
 */
router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const activity = await Activity.getUserActivity(req.params.username)
    
    return res.json(activity);
  } catch (err) {
    return next(err);
  }
});



module.exports = router;
