"use strict";

const db = require("../db");

const {
  NotFoundError,
  InactiveError,
  BadRequestError,
} = require("../expressError");

const {
  sqlForPartialUpdate,
  sqlForGameFilters,
  sqlForGameComments,
} = require("../helper/sql");

function NotFoundMsgGame(gameId) {
  return `No game: ${gameId}`;
}

function InactiveMsgGame(gameId) {
  return `Game inactive: ${gameId}`;
}
function NotFoundMsgUser(username) {
  return `No user: ${username}`;
}

function InactiveMsgUser(username) {
  return `User inactive: ${username}`;
}

class Game {
  /** Given a gameId, return data about game.
   *
   * @param {number} gameId
   * @returns {object} { id,
   *                  title,
   *                  description,
   *                  date,
   *                  time,
   *                  address,
   *                  city,
   *                  state,
   *                  createdOn,
   *                  createdBy,
   *                  daysDiff }
   *
   *    where daysDiff is the difference in days between game date and today
   * active games have is_active status of true
   * Throws NotFoundError if game not found.
   **/
  static async get(gameId) {
    const gameRes = await db.query(
      `SELECT id,
                title,
                description, 
                game_date AS "date", 
                game_time AS "time", 
                game_address AS "address", 
                game_city AS "city", 
                game_state AS "state", 
                created_on AS "createdOn", 
                created_by AS "createdBy", 
                is_active AS "isActive",
                game_date::date - current_date::date AS "daysDiff"
        FROM games
        WHERE id = $1`,
      [gameId]
    );

    const game = gameRes.rows[0];

    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));

    if (!game.isActive) throw new InactiveError(InactiveMsgGame(gameId));

    delete game.isActive;

    return game;
  }

  /**
   * Find all games (optional filter on searchFilters, isActive, gameStatus )
   *
   * @param {string} query preliminary query detailing columns selected
   * @param {object} searchFilters (optional filter on searchFilters
   *  - date
   *  = city
   *  - state
   *  - host {username} (WHERE created_by = host)
   *  - joined {username} (returns all games a user has joined)
   *  - isActive
   *    - true (WHERE is_active = true)
   *    = false (WHERE is_active = false)
   *    - undefined returns all users regardless of isActive status
   *  - gameStatus
   *    - 'pending' returns games whose game_date has not passed
   *    - 'resolved' returns games whose game_date has passed
   *    - undefined returns all games regardless of game_date
   *  Throw bad request if any other value is passed
   *
   * @returns {array} [{id,
   *                    title,
   *                    description,
   *                    date,
   *                    time,
   *                    city,
   *                    state,
   *                    createdOn,
   *                    createdBy,
   *                    players,
   *                    daysDiff,
   *                    isActive}....]
   *  where players = count of active players
   *  where daysDiff = count of days until game_date (neg number indicates how many days have passed since game_date)
   *
   */
  static async findAll(searchFilters = {}) {
    let findAllQuery = `SELECT g.id,
                               g.title,
                               g.game_date AS "date", 
                               g.game_time AS "time", 
                               g.game_address AS "address", 
                               g.game_city AS "city", 
                               g.game_state AS "state", 
                               g.created_by AS "createdBy", 
                               (SELECT (COUNT(u.username) FILTER (WHERE u.is_active = true))::integer AS "players" 
                                  FROM users AS u 
                                  LEFT JOIN users_games AS ug 
                                  ON u.username = ug.username 
                                  WHERE ug.game_id = g.id),
                               (g.game_date::date - current_date::date) AS "daysDiff",
                               g.is_active AS "isActive"
                      FROM games AS g
                      LEFT JOIN users_games AS ug
                      ON g.id = ug.game_id
                      LEFT JOIN users AS u 
                      on ug.username = u.username`;

    const [query, queryValues] = sqlForGameFilters(findAllQuery, searchFilters);
    const gamesRes = await db.query(query, queryValues);

    return gamesRes.rows;
  }

  /** Create a game (from data), update db, return new game data.
   *
   * @param {object} data { title,
   *                        description,
   *                         date,
   *                        time,
   *                        address,
   *                        city,
   *                        state,
   *                        createdBy }
   * @returns {object} { id,
   *                     title,
   *                     description,
   *                     date,
   *                     time,
   *                     address,
   *                     city,
   *                     state,
   *                     createdOn,
   *                     createdBy,
   *                     daysDiff }
   **/

  static async create(data) {
    const result = await db.query(
      `INSERT INTO games (title, 
                          description, 
                          game_date, 
                          game_time, 
                          game_address, 
                          game_city, 
                          game_state, 
                          created_by )
           VALUES  ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING  id,
                      title,
                      description, 
                      game_date AS "date", 
                      game_time AS "time", 
                      game_address AS "address", 
                      game_city AS "city", 
                      game_state AS "state", 
                      created_on AS "createdOn", 
                      created_by AS "createdBy", 
                      (game_date::date - current_date::date) AS "daysDiff"`,
      [
        data.title,
        data.description,
        data.date,
        data.time,
        data.address,
        data.city,
        data.state,
        data.createdBy,
      ]
    );
    let game = result.rows[0];

    return game;
  }

  /** Update game data with gameId and `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   * @param {object} data { title, description, date, time, address, city, state }
   * @param {number} gameId
   * @returns {object} { id,
   *                     title,
   *                     description,
   *                     date,
   *                     time,
   *                     address,
   *                     city,
   *                     state,
   *                     createdOn,
   *                     createdBy,
   *                     daysDiff }
   *
   * Throws NotFoundError if not found.
   * Throws BadRequestError if invalid fields are provided
   */

  static async update(gameId, data) {
    const jsToSql = {
      title: "title",
      description: "description",
      date: "game_date",
      time: "game_time",
      address: "game_address",
      city: "game_city",
      state: "game_state",
    };

    const { setCols, values } = sqlForPartialUpdate(data, jsToSql);

    const gameIdx = "$" + (values.length + 1);

    const querySql = `UPDATE games
                              SET ${setCols}
                              WHERE id = ${gameIdx}
                              RETURNING  id,
                                         title,
                                         description, 
                                         game_date AS "date", 
                                         game_time AS "time", 
                                         game_address AS "address", 
                                         game_city AS "city", 
                                         game_state AS "state", 
                                         created_on AS "createdOn", 
                                         created_by AS "createdBy", 
                                         is_active AS "isActive",
                                         (game_date::date - current_date::date) AS "daysDiff"`;

    const result = await db.query(querySql, [...values, gameId]);
    const game = result.rows[0];

    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));

    if (!game.isActive) throw new InactiveError(InactiveMsgGame(gameId));
    delete game.isActive;

    return game;
  }

  /**
   * Deactivates game with gameId
   * equivalent to deleting game,
   * however, this allows user to archive game and reactivate
   *
   * @param {number} gameId
   * @returns {undefined}
   *
   * Throws NotFoundError if gameId does not exist
   */
  static async deactivate(gameId) {
    const result = await db.query(
      `UPDATE games
         SET is_active = false
         WHERE id = $1
         RETURNING id`,
      [gameId]
    );
    const game = result.rows[0];

    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));
  }

  /**
   * Reactivates game with gameId
   *
   * @param {number} gameId
   * @returns {object} { id,
   *                     title,
   *                     description,
   *                     date,
   *                     time,
   *                     address,
   *                     city,
   *                     state,
   *                     createdOn,
   *                     createdBy,
   *                     players,
   *                     daysDiff }
   *
   * Throws NotFoundError if gameId does not exist
   */
  static async reactivate(gameId) {
    const result = await db.query(
      `UPDATE games
         SET is_active = true
         WHERE id = $1
         RETURNING id, 
                   title, 
                   description, 
                   game_date AS "date", 
                   game_time AS "time", 
                   game_address AS "address", 
                   game_city AS "city", 
                   game_state AS "state", 
                   created_on AS"createdOn", 
                   created_by AS "createdBy", 
                   (game_date::date - current_date::date) AS "daysDiff"`,
      [gameId]
    );
    const game = result.rows[0];

    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));

    return game;
  }

  /**Given a gameId, returns data on game comments
   *  optional fitlers
   *  - isGameCommentsActive - addtional filter for returning games active/inactive comments
   *  - isUsersActive - additional filter for returning comments from active/inactive users
   *
   * Throws BadRequestError if isCommentsActive/isUsersActive !== boolean, null, undefined
   *
   * @param {number} gameId
   * @param {boolean} isGameCommentsActive
   * @param {boolean} isUsersActive
   * @returns {array} {[{id, username, comment, createdOn} ...]}
   *
   * Throws NotFoundError if gameId does not exist
   */

  static async getGameComments(gameId, isGameCommentsActive, isUsersActive) {
    const gameCheck = await db.query(
      `SELECT is_active FROM games WHERE id = $1`,
      [gameId]
    );

    if (
      typeof isGameCommentsActive !== "boolean" &&
      typeof isGameCommentsActive !== "undefined" &&
      isGameCommentsActive !== null
    )
      throw new BadRequestError(
        "isGameCommentsActive accepts undefined, null, or boolean as valid data type"
      );

    if (
      typeof isUsersActive !== "boolean" &&
      typeof isUsersActive !== "undefined" &&
      isUsersActive !== null
    )
      throw new BadRequestError(
        "isUsersActive accepts undefined, null, or boolean as valid data type"
      );

    const game = gameCheck.rows[0];
    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));

    const gameCommentQuery = `SELECT gc.id, 
                                     gc.username, 
                                     gc.comment, 
                                     gc.created_on AS "createdOn"
                              FROM games_comments AS gc
                              LEFT JOIN users AS u
                              ON gc.username = u.username`;

    const [query, queryValues] = sqlForGameComments(
      gameCommentQuery,
      gameId,
      isGameCommentsActive,
      isUsersActive
    );

    const commentsRes = await db.query(query, queryValues);

    return commentsRes.rows;
  }

  /**Given a gameId, returns data on game players
   * optional fitlers
   *  - isUserActive - additional filter for returning active/inactive users
   *
   * Throws BadRequestError if isUser !== boolean, null, undefined
   *
   * @param {number} gameId
   * @param {boolean} isUserActive
   * @returns {array} {[{id, username, comment, createdOn} ...]}
   *
   * Throws NotFoundError if gameId does not exist
   */

  static async getGamePlayers(gameId, isUserActive) {
    const gameCheck = await db.query(
      `SELECT is_active FROM games WHERE id = $1`,
      [gameId]
    );
    const game = gameCheck.rows[0];
    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));

    if (
      typeof isUserActive !== "boolean" &&
      typeof isUserActive !== "undefined" &&
      isUserActive !== null
    )
      throw new BadRequestError(
        "isUserActive accepts undefined, null, or boolean as valid data type"
      );

    let query = `SELECT json_object_agg(ug.username, u.profile_img) as "players"
                        FROM users_games AS ug
                        LEFT JOIN users AS u
                        ON ug.username = u.username
                        WHERE ug.game_id = $1`;

    if (isUserActive === true) query += " AND u.is_active = true";
    if (isUserActive === false) query += " AND u.is_active = false";

    query += " GROUP BY ug.game_id";

    const playersRes = await db.query(query, [gameId]);

    const players = playersRes.rows;
    if (!players.length) return players;

    return players[0].players;
  }

  /**Adds user with username to game with gameId
   *
   * only meant to add users who are not game hosts
   * returns update player list of game
   *
   * @param {number} gameId
   * @param {string} username
   * @returns {object} {username: profileImg, ...}
   * throws InactiveError if user/game are inactive
   * throws NotFoundError if user/game not found
   */

  static async addUserGame(gameId, username) {
    const usernameGameCheck = await db.query(
      `SELECT (SELECT is_active AS "game" FROM games WHERE id = $1), (SELECT is_active AS 
        "user" FROM users WHERE username = $2)`,
      [gameId, username]
    );
    const result = usernameGameCheck.rows[0];

    if (result.game === null) throw new NotFoundError(NotFoundMsgGame(gameId));
    if (result.user === null)
      throw new NotFoundError(NotFoundMsgUser(username));
    if (!result.game) throw new InactiveError(InactiveMsgGame(gameId));
    if (!result.user) throw new InactiveError(InactiveMsgUser(username));

    await db.query(
      `INSERT INTO users_games(game_id, username)
           VALUES ($1, $2)`,
      [gameId, username]
    );
    const playersRes = await db.query(
      `SELECT json_object_agg(ug.username, u.profile_img) AS "players"
          FROM users_games AS ug
          LEFT JOIN users AS u
          ON ug.username = u.username
          WHERE ug.game_id = $1 AND u.is_active = true
          GROUP by game_id`,
      [gameId]
    );
    const players = playersRes.rows;
    if (!players.length) return players;

    return players[0].players;
  }

  /**Removes user with username from game with gameId
   *
   * @param {number} gameId
   * @param {string} username
   * @returns {object} {username: profileImg, ...}
   *
   * throws InactiveError if user/game are inactive
   * throws NotFoundError if user/game not found
   */
  static async removeUserGame(gameId, username) {
    const usernameGameCheck = await db.query(
      `SELECT (SELECT is_active AS "game" FROM games WHERE id = $1), (SELECT is_active AS 
        "user" FROM users WHERE username = $2)`,
      [gameId, username]
    );
    const result = usernameGameCheck.rows[0];

    if (result.game === null) throw new NotFoundError(NotFoundMsgGame(gameId));
    if (result.user === null)
      throw new NotFoundError(NotFoundMsgUser(username));
    if (!result.game) throw new InactiveError(InactiveMsgGame(gameId));
    if (!result.user) throw new InactiveError(InactiveMsgUser(username));

    await db.query(
      `DELETE FROM users_games
       WHERE game_id = $1 AND username = $2`,
      [gameId, username]
    );
    const playersRes = await db.query(
      `SELECT json_object_agg(ug.username, u.profile_img) AS "players"
          FROM users_games AS ug
          LEFT JOIN users AS u
          ON ug.username = u.username
          WHERE ug.game_id = $1 AND u.is_active = true
          GROUP by game_id`,
      [gameId]
    );
    const players = playersRes.rows;
    if (!players.length) return players;

    return players[0].players;
  }

  /** Given commentData, creates a comment from username for game with gameId
   *
   * @param {object} commentData - {gameId, username, comment}
   * @returns {object} {id, username, comment, createdOn}
   *
   * Throws NotFound if username/gameId do not exist
   */
  static async addGameComment({ gameId, username, comment }) {
    const userCheckQuery = `SELECT username FROM users WHERE username = $1`;
    const gameCheckQuery = `SELECT id FROM games WHERE id = $2`;
    const checkRes = await db.query(
      `SELECT (${userCheckQuery}) as "user", (${gameCheckQuery}) as "game"`,
      [username, gameId]
    );
    const check = checkRes.rows[0];

    if (!check.user) throw new NotFoundError(NotFoundMsgUser(username));
    if (!check.game) throw new NotFoundError(NotFoundMsgGame(gameId));

    const result = await db.query(
      `
    INSERT INTO games_comments(game_id, username, comment, is_active)
    VALUES ($1, $2, $3, true)
    RETURNING id, username, comment, created_on AS "createdOn"
`,
      [gameId, username, comment]
    );

    return result.rows[0];
  }

  /** Given commentId, deactivates game comment
   *
   * @param {number} commentId
   * @returns {object} {id, username, comment, createdOn} comment details
   *
   * Throws NotFound if commentId do not exist
   */
  static async deactivateGameComment(commentId) {
    const commentCheck = await db.query(
      `SELECT id FROM games_comments WHERE id = $1`,
      [commentId]
    );
    if (!commentCheck.rows[0])
      throw new NotFoundError(`No comment: ${commentId}`);

    const result = await db.query(
      `UPDATE games_comments
       SET is_active = false
       WHERE id = $1
       RETURNING id, username, comment, created_on as "createdOn"`,
      [commentId]
    );
    return result.rows[0];
  }
}

module.exports = Game;
