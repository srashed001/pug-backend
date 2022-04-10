"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");

const {
  NotFoundError,
  BadRequestError,
  UnauthError,
  InactiveError,
  ExpressError,
} = require("../expressError");

const { sqlForPartialUpdate } = require("../helper/sql");

const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");

class Game {
  /** Given a gameId, return data about game.
   *
   * Returns { id, title, description, date, time, address, city, state, createdOn, createdBy, players }
   *   where players is [username, ...]
   *
   * Throws NotFoundError if game not found.
   **/
  static async get(gameId) {
      const gameRes = await db.query(
          `SELECT id,
                  description, 
                  game_date AS "date", 
                  game_time AS "time", 
                  game_address AS "address", 
                  game_city AS "city", 
                  game_state AS "state", 
                  created_on AS "createdOn", 
                  created_by AS "createdBy", 
                  is_active AS "isActive"
            FROM game
            WHERE id = $1`, 
            [gameId]
      )

      const game = gameRes.rows[0];

      if(!game) throw new NotFoundError(`No game: ${gameId}`)

      const gamePlayers = await db.query(
          `SELECT username
          FROM users_games
          WHERE game_id = $1`,
          [gameId]
      )

      game.player = gamePlayers.map(g=>g.username)

      return game


  
  }

}

module.exports = Game;
