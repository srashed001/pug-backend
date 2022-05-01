"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const db = require("../db");
const { UnauthError, NotFoundError, BadRequestError } = require("../expressError");

/** Autheticate user
 *
 * If a token was provided via header, verify it, and, if valid, store token payload
 * on res.locals (user: {iat, username, isAdmin})
 *
 * No error raised if invalid/no token provided
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Ensures a user is logged in
 *
 * if !res.locals.user, raises UnauthError
 */
function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Ensures user is logged in and matches username param
 *  Or user is admin
 *
 * raises UnauthError otherwise
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!(user && (user.isAdmin || user.username === req.params.username)))
      throw new UnauthError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Ensures game update can only be made by game host or admin
 *
 * raises UnauthError otherwise
 */
async function ensureHostOrAdmin(req, res, next) {
  try {
    const result = await db.query(`SELECT created_by AS "createdBy" FROM games WHERE id = $1`, [req.params.gameId])
    if(!result.rows[0]) throw new NotFoundError(`No Game: ${req.params.gameId}`)

    const { createdBy } = result.rows[0]
    const user = res.locals.user;
    if (!(user && (user.isAdmin || user.username === createdBy)))
      throw new UnauthError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Ensures proper authorization to delete comment
 * Proper authorization includes: 
 *  - admin
 *  - game host
 *  - comment creator
 * 
 * raises UnauthError otherwise
 */
async function ensureAuthDeleteComment(req, res, next){
  try{
    const result = await db.query(`SELECT 
                                   (SELECT created_by FROM games WHERE id = $1) AS "createdBy",
                                   (SELECT username FROM games_comments WHERE id = $2) AS "username",
                                   (SELECT game_id FROM games_comments WHERE id = $2) AS "gameId"
                                   `, 
                                   [req.params.gameId, req.params.commentId])
    
    const {username, createdBy, gameId} = result.rows[0]

    if(!username) throw new NotFoundError(`No comment: ${req.params.commentId}`)
    if(!createdBy) throw new NotFoundError(`No game: ${req.params.gameId}`)
    if(+req.params.gameId !== gameId) throw new BadRequestError(`Comment does not belong to game: ${req.params.gameId}`)

    const user = res.locals.user;
    if (!(user && (user.isAdmin || user.username === createdBy || user.username === username)))
    throw new UnauthError();

    return next()
  } catch(err){
    return next(err)
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
  ensureHostOrAdmin,
  ensureAuthDeleteComment
};
