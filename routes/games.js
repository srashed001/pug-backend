"use strict";

const jsonschema = require("jsonschema");
const newGameSchema = require('../schemas/newGameSchema.json')
const gameSearchSchema = require("../schemas/gameSearch.json");
const gameUpdateSchema = require("../schemas/gameUpdate.json");
const newGameCommentSchema = require("../schemas/newGameComment.json");
const express = require("express");
const { BadRequestError } = require("../expressError");
const Game = require("../models/game");

const {
  ensureHostOrAdmin,
  ensureCorrectUserOrAdmin,
  ensureAuthDeleteComment,
  ensureLoggedIn,
} = require("../middleware/auth");

const router = express.Router();

/** POST / { game } => { game }
 * 
 * game should be { title, description, date, time, address, city, state}
 * 
 * Returns { id, title, description, date, time, address, city, state, createdOn, createdBy, daysDiff}
 * 
 * Authorization required: logged in user
 */
router.post("/", ensureLoggedIn, async function(req, res, next){
  try{
    const validator = jsonschema.validate(req.body, newGameSchema)
    if(!validator.valid){
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs)
    }
    req.body.createdBy = res.locals.user.username
    const details = await Game.create(req.body)
    return res.status(201).json({details})
  }catch(err){
    return next(err)
  }
})

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
  if (q.isActive === "true" || q.isActive === "false")
    q.isActive = JSON.parse(q.isActive);

  try {
    const validator = jsonschema.validate(q, gameSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const games = await Game.findAll(q);
    return res.json({ games });
  } catch (err) {
    return next(err);
  }
});

/** GET /[gameId] => {game}
 *
 * Returns {details, comments, players}
 *  where details is {id, title, description, date, time, address, city, state, createdOn, createdBy, daysDiff}
 *  where comments is [{id, username, comment, createdOn}, ...]
 *  where players is {username1: profileImg, username2: profileImg, ... }
 *
 *
 * Authorization required: none
 */
router.get("/:gameId", async function (req, res, next) {
  try {
    const details = await Game.get(+req.params.gameId);
    const comments = await Game.getGameComments(+req.params.gameId, true, true);
    const players = await Game.getGamePlayers(+req.params.gameId, true);

    return res.json({ details, comments, players });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[gameId] {data} => {game}
 * Data can include:
 * Data can include:
 *  { title, description, date, time, address, city, state }
 *
 * Returns { id, title, description, date, time, address, city, state, createdOn, createdBy, daysDiff}
 *
 * Authorization required: admin or same-user-as-:gameId host
 */

router.patch(`/:gameId`, ensureHostOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, gameUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const details = await Game.update(req.params.gameId, req.body);
    return res.json({ details });
  } catch (err) {
    return next(err);
  }
});

/** POST /[gameId]/comment/:usernme {data} => {gameComment}
 *  Data must include:
 *     {comment}
 *
 * Returns {id, username, comment, createdOn}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post(
  `/:gameId/comment/:username`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, newGameCommentSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const comment = await Game.addGameComment({
        gameId: +req.params.gameId,
        username: req.params.username,
        comment: req.body.comment,
      });

      return res.status(201).json({ comment });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /comment/[commentId] {data} => {action, gameComment}
 *
 * Returns {action: 'deactivate', comment: {id, username, comment, createdOn}}
 *
 * Authorization required:
 *  - game host
 *  - admin
 *  - comment creator
 */
router.delete(
  `/:gameId/comment/:commentId`,
  ensureAuthDeleteComment,
  async function (req, res, next) {
    try {
      const comment = await Game.deactivateGameComment(req.params.commentId);
      return res.json({ action: "deactivated", comment });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[gameId]/join/[username]
 *
 * Returns {players {username:profileImg, ....}} updated user list
 *
 * Throw NotFoundError when username not found
 * Throws InactiveError if username/game is inactive
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post(
  `/:gameId/join/:username`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const players = await Game.addUserGame(
        +req.params.gameId,
        req.params.username
      );
      return res.status(201).json({ players });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[gameId]/join/[username]
 *
 * Returns {players {username:profileImg, ....}} updated user list
 *
 * Throw NotFoundError when username not found
 * Throws InactiveError if username/game is inactive
 *
 * Authorization required: admin or same-user-as-:username
 */
router.delete(
  `/:gameId/join/:username`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const players = await Game.removeUserGame(
        +req.params.gameId,
        req.params.username
      );
      return res.json({ players });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[gameId]/deactivate
 *
 * Returns {action: 'deactivated', game: gameId}
 *
 * Throws NotFoundError when gameId not found
 *
 * Authorization required: Admin or game host
 */
router.patch(
  `/:gameId/deactivate`,
  ensureHostOrAdmin,
  async function (req, res, next) {
    try {
      const game = await Game.deactivate(req.params.gameId);
      return res.json({ action: "deactivated", game });
    } catch (err) {
      return next(err);
    }
  }
);
/** POST /[gameId]/reactivate
 *
 * Returns {action: 'reactivated', game: gameId}
 *
 * Throws NotFoundError when gameId not found
 *
 * Authorization required: Admin or game host
 */
router.patch(
  `/:gameId/reactivate`,
  ensureHostOrAdmin,
  async function (req, res, next) {
    try {
      const game = await Game.reactivate(req.params.gameId);
      return res.json({ action: "reactivated", game });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
