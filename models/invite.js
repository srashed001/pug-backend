"use strict";

const db = require("../db");

const {
  NotFoundError,
  InactiveError,
  BadRequestError,
} = require("../expressError");

function NotFoundInvite(inviteId) {
  return `No invite: ${inviteId}`;
}

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

class Invite {
  /** Create an invite to a game from data, update db, return new invite data
   * creates invite only if to_user does not have 'pending' invite from active user
   *
   * @param {object} data {gameId, fromUser, toUser}
   * @returns {object} {id, toUser, createdOn}
   *
   * Throws NotFoundError if gameId, fromUser, or toUser do not exist
   * Throws Inactive if game, fromUser, or toUser are inactive
   * Throws BadRequest if to_user already has 'pending' invites from another active user
   */
  static async create(data) {
    const gameQuery = 'SELECT is_active as "game" FROM games WHERE id = $1';
    const fromUserQuery =
      'SELECT is_active as "fromUser" FROM users WHERE username = $2';
    const toUserQuery =
      'SELECT is_active as "toUser" FROM users WHERE username = $3';
    const inviteQuery = `SELECT ui.id AS "invite" 
             FROM users_invites AS ui
             LEFT JOIN users AS u
             ON ui.from_user = u.username
             WHERE ui.game_id = $1 AND ui.to_user = $3 AND ui.status = 'pending' AND u.is_active = true`;

    const checkRes = await db.query(
      `SELECT (${gameQuery}), (${fromUserQuery}), (${toUserQuery}), (${inviteQuery})`,
      [data.gameId, data.fromUser, data.toUser]
    );

    const checks = checkRes.rows[0];

    // checks
    if (checks.game === null)
      throw new NotFoundError(NotFoundMsgGame(data.gameId));
    if (!checks.game) throw new InactiveError(InactiveMsgGame(data.gameId));

    if (checks.fromUser === null)
      throw new NotFoundError(NotFoundMsgGame(data.fromUser));
    if (!checks.fromUser)
      throw new InactiveError(InactiveMsgGame(data.fromUser));

    if (checks.toUser === null)
      throw new NotFoundError(NotFoundMsgGame(data.toUser));
    if (!checks.toUser) throw new InactiveError(InactiveMsgGame(data.toUser));

    if (checks.invite)
      throw new BadRequestError(`User: ${data.toUser} has invite 'pending'`);

    const inviteRes = await db.query(
      `
            INSERT INTO users_invites (game_id, from_user, to_user)
            VALUES ($1, $2, $3)
            RETURNING id, to_user as "toUser", created_on as "createdOn"`,
      [data.gameId, data.fromUser, data.toUser]
    );

    const invite = inviteRes.rows[0];

    return invite;
  }

  /** Returns data on invite with inviteId
   *
   * @param {number} inviteId
   * @returns {object} {id, gameId, fromUser, toUser, status, createdOn}
   *
   * Throws not found if inviteId does not exist
   */
  static async get(inviteId) {
    const inviteCheckRes = await db.query(
      `SELECT id,
              game_id AS "gameId",
              from_user AS "fromUser", 
              to_user AS "toUser", 
              status, 
              created_on AS "createdOn"
        FROM users_invites WHERE id = $1`,
      [inviteId]
    );

    const inviteCheck = inviteCheckRes.rows[0];
    if (!inviteCheck) throw new NotFoundError(NotFoundInvite(inviteId));

    return inviteCheck;
  }

  /** Returns data on ALL game invites with gameId
   * data returned includes data on inactive users and inactive games
   *
   * @param {number} gameId
   * @returns {array} [{id, fromUser, toUser, status, createdOn}, ...]
   *
   * Throws NotFoundError if gameId does not exist
   * Throws InactiveError if game with gameId is inactive
   */
  static async getAllGameInvites(gameId) {
    const gameCheckRes = await db.query(
      `SELECT is_active FROM games WHERE id = $1`,
      [gameId]
    );
    const gameCheck = gameCheckRes.rows[0];

    if (!gameCheck) throw new NotFoundError(NotFoundMsgGame(gameId));
    if (!gameCheck.is_active) throw new InactiveError(InactiveMsgGame(gameId));

    const invitesRes = await db.query(
      `
      SELECT id,
             from_user AS "fromUser", 
             to_user AS "toUser",
             status, 
             created_on AS "createdOn"
     FROM users_invites
     WHERE game_id = $1`,
      [gameId]
    );

    const invites = invitesRes.rows;
    return invites;
  }

  /**Given a username, returns all invites sent by user
   * data returned includes data on inactive users and inactive games
   *
   * @param {string} username
   * @returns {array} [{id, game_id, toUser, status, createdOn}, ...]
   *
   * Throws InactiveError if username is inactive
   * Throws NotFound if username is not found
   */
  static async getAllInvitesSent(username) {
    const userCheck = await db.query(
      `SELECT is_active from users WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(NotFoundMsgUser(username));
    if (!user.is_active) throw new InactiveError(InactiveMsgUser(username));

    const invitesRes = await db.query(
      `
            SELECT id, 
                   game_id AS "gameId", 
                   to_user AS "toUser", 
                   status, 
                   created_on AS "createdOn"
            FROM users_invites 
            WHERE from_user = $1`,
      [username]
    );

    const invitesSent = invitesRes.rows;

    return invitesSent;
  }
  /**Given a username, returns data on all invites sent to active users by user
   * data returned will not include data on inactive users or inactive games
   *
   * @param {string} username
   * @returns {array} [{id, game_id, toUser, status, createdOn}, ...]
   *
   * Throws InactiveError if username is inactive
   * Throws NotFound if username is not found
   */
  static async getInvitesSent(username) {
    const userCheck = await db.query(
      `SELECT is_active from users WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(NotFoundMsgUser(username));
    if (!user.is_active) throw new InactiveError(InactiveMsgUser(username));

    const invitesRes = await db.query(
      `
            SELECT ui.id, 
                   game_id AS "gameId", 
                   ui.to_user AS "toUser", 
                   ui.status, 
                   ui.created_on AS "createdOn"
            FROM users_invites ui
            LEFT JOIN users u
            ON ui.to_user = u.username
            RIGHT JOIN games g
            ON ui.game_id = g.id
            WHERE from_user = $1 AND u.is_active = true AND g.is_active`,
      [username]
    );

    const invitesSent = invitesRes.rows;

    return invitesSent;
  }

  /**Given a username, returns data on all invites received by user
   * data returned includes data on inactive users and inactive games
   *
   * @param {string} username
   * @returns {array} [{id, game_id, fromUser, status, createdOn}, ...]
   *
   * Throws InactiveError if username is inactive
   * Throws NotFound if username is not found
   */
  static async getAllInvitesReceived(username) {
    const userCheck = await db.query(
      `SELECT is_active from users WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(NotFoundMsgUser(username));
    if (!user.is_active) throw new InactiveError(InactiveMsgUser(username));

    const invitesRes = await db.query(
      `
            SELECT id, 
                    game_id AS "gameId", 
                    from_user AS "fromUser", 
                    status, 
                    created_on AS "createdOn"
            FROM users_invites
            WHERE to_user = $1`,
      [username]
    );

    const invitesSent = invitesRes.rows;

    return invitesSent;
  }
  /**Given a username, returns all invites received from active users to user
   * data on inactive users or inactive games will not be returned
   *
   * @param {string} username
   * @returns {array} [{id, game_id, fromUser, status, createdOn}, ...]
   *
   * Throws InactiveError if username is inactive
   * Throws NotFound if username is not found
   */
  static async getInvitesReceived(username) {
    const userCheck = await db.query(
      `SELECT is_active from users WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(NotFoundMsgUser(username));
    if (!user.is_active) throw new InactiveError(InactiveMsgUser(username));

    const invitesRes = await db.query(
      `
            SELECT ui.id, 
                    ui.game_id, 
                    ui.from_user AS "fromUser", 
                    ui.status, 
                    ui.created_on AS "createdOn"
            FROM users_invites ui
            LEFT JOIN users u
            ON ui.from_user = u.username
            RIGHT JOIN games g
            ON ui.game_id = g.id
            WHERE to_user = $1 AND u.is_active = true AND g.is_active`,
      [username]
    );

    const invitesSent = invitesRes.rows;

    return invitesSent;
  }

  /**Given a gameId, returns data on invites sent for game
   * data will only include data where:
   *    from_user is active
   *    to_user is active
   *    status is 'pending'
   *
   * @param {number} gameId
   * @returns {array} [{id, toUser, createdOn}, ...]
   *
   *  Throws InactiveError if game is inactive
   *  Throws NotFound if gameId is not found
   */
  static async getGameInvites(gameId) {
    const gameCheck = await db.query(
      `SELECT is_active from games WHERE id = $1`,
      [gameId]
    );
    const game = gameCheck.rows[0];
    if (!game) throw new NotFoundError(NotFoundMsgGame(gameId));
    if (!game.is_active) throw new InactiveError(InactiveMsgGame(gameId));

    const invitesRes = await db.query(
      `
            SELECT ui.id, 
                    ui.to_user AS "toUser", 
                    ui.created_on AS "createdOn"
            FROM users_invites ui
            LEFT JOIN users u
            ON ui.to_user = u.username
            RIGHT JOIN games g
            ON ui.game_id = g.id
            WHERE ui.game_id = $1 AND u.is_active = true AND ui.status = 'pending'
            AND ui.from_user IN (
                SELECT ui.from_user 
                FROM users_invites ui
                LEFT JOIN users AS u
                ON ui.from_user = u.username 
                WHERE u.is_active = true
            )`,
      [gameId]
    );

    const gameInvites = invitesRes.rows;

    return gameInvites;
  }

  /** Given inviteId and status, updates invite.status with status
   * status can only be updated with the following:
   *    'accepted'
   *    'denied'
   *    'cancelled'
   *    'pending'
   *
   * @param {number} inviteId
   * @param {string} status
   * @returns {object} {id, gameId, fromUser, toUser, status, createdOn}
   *
   * Throws NotFoundError if inviteId does not exist
   * Throws BadRequestError if updated status with current status
   * Throws BadRequestError if updated status is not valid status
   */
  static async update(inviteId, status) {
    const statusCheckSet = new Set([
      "accepted",
      "denied",
      "cancelled",
      "pending",
    ]);
    const inviteCheck = await db.query(
      `SELECT status FROM users_invites WHERE id = $1`,
      [inviteId]
    );
    const invite = inviteCheck.rows[0];

    if (!invite) throw new NotFoundError(NotFoundInvite(inviteId));
    if (invite.status === status)
      throw new BadRequestError(`Invite status already '${status}'`);
    if (!statusCheckSet.has(status))
      throw new BadRequestError(`Updated invite status invalid`);

    const updatedInviteRes = await db.query(
      `UPDATE users_invites
        SET status = $1
        WHERE id = $2
        RETURNING id, 
                  game_id AS "gameId", 
                  from_user AS "fromUser", 
                  to_user AS "toUser", 
                  status,
                  created_on AS "createdOn"`,
      [status, inviteId]
    );

    const updatedInvite = updatedInviteRes.rows[0];
    return updatedInvite;
  }

  /** Given inviteId, deletes invite, updates db, and returns undefined
   *
   * @param {number} inviteId
   * @returns {undefined}
   *
   * Throws NotFoundError if inviteId does not exist
   */
  static async delete(inviteId) {
    const inviteRes = await db.query(
      `
      DELETE FROM users_invites 
      WHERE id = $1
      RETURNING id`,
      [inviteId]
    );

    const invite = inviteRes.rows[0];
    if (!invite) throw new NotFoundError(NotFoundInvite(inviteId));
  }
}

module.exports = Invite;
