"use strict";

const db = require("../db");
const { v4: uuid } = require("uuid");

const { NotFoundError, BadRequestError } = require("../expressError");

function NotFoundMsgUser(username) {
  return `No user: ${username}`;
}

class Message {
  /** Given array of users, checks if all users in array exist
   *  returns undefined if all users exist
   *  throws NotFoundError with err.message providing all users that does exist
   *
   * @param {array} usersArray is array of users being checked exit
   * @returns {undefined}
   * Throws BadRequestError if usersArray param is not array
   * Throws NotFound if user in usersArray is not found
   */
  static async checkUsersExist(usersArray) {
    if (!Array.isArray(usersArray))
      throw new BadRequestError(
        `checkThreadUsers requires parameter to be array`
      );

    const selectQueryArr = usersArray.map(
      (el, i) =>
        `(SELECT username FROM users WHERE username = $${i + 1}) AS "${el}"`
    );
    const query = await db.query(
      `SELECT ${selectQueryArr.join(", ")}`,
      usersArray
    );
    const results = query.rows[0];
    let errors = [];
    for (let [k, v] of Object.entries(results)) {
      if (!v) errors.push(k);
    }

    if (errors.length) throw new NotFoundError(`${errors} not found`);
  }

  /** Given array of username, checks if thread exists containing only and all users in array
   * returns thread id if one exists
   * returns empty object if no thread currently exists
   *
   * @param {array} usersArr
   * @returns {string} thread id where only users in usersArr belong to
   */
  static async getThreadByUsers(usersArr) {
    if (usersArr.length < 2 || !Array.isArray(usersArr))
      throw new BadRequestError(
        `getThreadByUsers requires parameter to be array with at least 2 users`
      );
    await this.checkUsersExist(usersArr);

    const usersCount = usersArr.length;
    const withQuery = `WITH thread_count AS (SELECT id, COUNT(username) AS "player_count" FROM users_threads GROUP BY id)`;
    const selectQuery = `SELECT ut.id
                             FROM thread_count as tc
                             LEFT JOIN users_threads as ut
                             ON tc.id = ut.id
                             LEFT JOIN users as u 
                             ON ut.username = u.username`;
    const countQuery = `(SELECT id FROM thread_count WHERE player_count = ${usersCount})`;
    const whereExpressions = usersArr.map(
      (el, i) =>
        `${selectQuery} WHERE ut.username = $${
          i + 1
        } and ut.id IN ${countQuery}`
    );
    const query = `${withQuery} ${whereExpressions.join(" INTERSECT ")} `;

    const threadRes = await db.query(query, usersArr);
    return threadRes.rows[0] ? threadRes.rows[0] : {};
  }

  /** Given a username, returns data on all threads username is a part of, ordered by most recent messages
   *
   * @param {string} username
   * @returns {array} [{threadId,
   *                    party: {username: profile_img, ...},
   *                    lastMsg: {username: message.created_on}}, ...]
   */
  static async getUserThreads(username) {
    const userCheckRes = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );
    if (!userCheckRes.rows[0])
      throw new NotFoundError(NotFoundMsgUser(username));

    const queryRes = await db.query(
      `SELECT ut.id AS "threadId", 
              json_agg(DISTINCT jsonb_build_object('username', ut.username, 'firstName', u.first_name, 'lastName', u.last_name, 'profileImg', u.profile_img)) AS "party",
              jsonb_build_object('message', m.message, 'timestamp', m.created_on::timestamp) AS "lastMessage"
       FROM users_threads AS ut
       LEFT JOIN users AS u
       ON ut.username = u.username
       LEFT JOIN messages AS m
       ON m.party_id = ut.id 
       WHERE ut.id IN (SELECT id FROM users_threads WHERE username = $1) 
       AND m.id = (SELECT MAX(id) 
                   FROM messages 
                   WHERE party_id = ut.id 
                   AND id NOT IN (SELECT message_id FROM inactive_messages WHERE username = $1) )
       GROUP BY ut.id, m.id
       ORDER BY m.id DESC`,
      [username]
    );



    return queryRes.rows;
  }

  /** Given array of users,
   *  - checks if thread already exists: true => returns existing threadId
   *  - if no existing thread => creates a new thread with users and returns new thread id
   *
   *
   * @param {array} usersArr
   * @returns {object} {id: threadId}
   *
   * Throws BadRequest if usersArr contains less than 2 users or is not array
   * Throws NotFound if user/s in array do not exist
   */
  static async createThread(usersArr) {
    if (usersArr.length < 2 || !Array.isArray(usersArr))
      throw new BadRequestError(
        `createThread requires parameter userArr to be array with at least 2 users`
      );

    // checks if all users in usersArr exist
    await this.checkUsersExist(usersArr);

    // check if thread already exists with users in usersArr, return threadId if true
    const idCheck = await this.getThreadByUsers(usersArr);

    if (idCheck.id) return idCheck;

    // if existing thread does not exist, create new thread id and add to users to users_thread with said id
    const newThreadId = uuid();
    const insertExpressions = usersArr.map(
      (el, i) => `($${usersArr.length + 1}, $${i + 1})`
    );

    await db.query(
      `INSERT INTO users_threads (id, username)
                                       VALUES ${insertExpressions.join(", ")}
                                       RETURNING id, username`,
      [...usersArr, newThreadId]
    );

    return { id: newThreadId };
  }

  /**Given msgFrom, msg, userArr, creates and update db with new message data
   * -new messages should appear on top when you retrive threads by username
   *
   * @param {string} msgFrom username sending message
   * @param {string} msg
   * @param {string} usersArr
   * @returns {object} {id: messageId, msgFrom, message, createdOn}
   *
   * Throws BadRequest if
   *  - usersArr contains less than 2 users
   *  - usersArr is not an array
   *  - msgFrom user is not in usersArr
   */

  static async createMessage(msgFrom, msg, usersArr) {
    if (usersArr.length < 2 || !Array.isArray(usersArr))
      throw new BadRequestError(
        `createMessage requires parameter userArr to be array with at least 2 users`
      );

    const userInUsersArrCheck = usersArr.find((el) => el === msgFrom);
    if (!userInUsersArrCheck)
      throw new BadRequestError(
        `msgFrom username: ${msgFrom} should appear in usersArr`
      );

    await this.checkUsersExist([...usersArr, msgFrom]);

    const { id: threadId } = await this.createThread(usersArr);

    const result = await db.query(
      ` INSERT INTO messages (party_id, message_from, message)
                                        VALUES ($1, $2, $3) RETURNING party_id AS "threadId", id, message_from AS "messageFrom", message, created_on AS "createdOn"`,
      [threadId, msgFrom, msg]
    );

    return result.rows[0];
  }

  /** Given threadId and username
   *    checks if username, threadId, and threadId with username exist
   *
   * @param {number} threadId
   * @param {string} username
   *
   * @returns {undefined}
   *
   * Throws NotFoundError if:
   *    - username not found
   *    - threadId not found
   *    - username with threadId not found
   */
  static async checkThreadId(threadId, username) {
    const userCheckQuery = `(SELECT username FROM users WHERE username = $1)`;
    const threadCheckQuery = `(SELECT id FROM users_threads WHERE username = $1 AND id = $2)`;

    const checkRes = await db.query(
      `SELECT ${userCheckQuery} as "user", 
              ${threadCheckQuery} as "thread"`,
      [username, threadId]
    );
    const check = checkRes.rows[0];
    if (!check.user) throw new NotFoundError(NotFoundMsgUser(username));
    if (!check.thread)
      throw new NotFoundError(
        `No threadId: ${threadId} with user: ${username}`
      );
  }

  /** Given threadId, username, message
   *    creates a response in a thread from username
   *
   * @param {String} threadId
   * @param {String} username
   * @param {String} message
   *
   * @returns {object} { id: messageId, messageFrom, message, createdOn }
   *
   * Throws NotFoundError if:
   *    - username not found
   *    - threadId not found
   *    - username with threadId not found
   */
  static async respondThread(threadId, username, message) {
    await this.checkThreadId(threadId, username);

    const result = await db.query(
      `INSERT INTO messages (party_id, message_from, message)
                                 VALUES ($1, $2, $3)
                                 RETURNING party_id AS "threadId", id, message_from AS "messageFrom", message, created_on AS "createdOn"
                                 `,
      [threadId, username, message]
    );
    return result.rows[0];
  }

  /** Given threadId and username,
   *    returns data on all active messages in thread for user
   *
   * @param {number} threadId
   * @param {string} username
   *
   * @returns {array} [ { id, messageFrom, message, createdOn }, ... ]
   *
   * Throws NotFoundError if:
   *    - username not found
   *    - threadId not found
   *    - username with threadId not found
   */
  static async getMsgsByThread(threadId, username) {
    await this.checkThreadId(threadId, username);

    const result = await db.query(
      `SELECT id, 
              message_from AS "messageFrom", 
              message, 
              created_on AS "createdOn", 
              party_id AS "threadId"
       FROM messages 
       WHERE party_id = $1
       AND id NOT IN (SELECT message_id FROM inactive_messages WHERE username = $2)
       ORDER BY id`,
      [threadId, username]
    );

    const threadRes = await db.query(
      `SELECT ut.id, json_agg(DISTINCT jsonb_build_object('username', ut.username, 'firstName', u.first_name, 'lastName', u.last_name, 'profileImg', u.profile_img)) AS "party"
      FROM users_threads AS ut
      LEFT JOIN users AS u
      ON ut.username = u.username
      WHERE ut.id = $1
      GROUP BY ut.id `,
      [threadId]
    );
    const messages = result.rows;
    return { ...threadRes.rows[0], messages };
  }

  /** Given threadId and username
   *    inactivates all messages in a thread for username
   *
   * @param {number} threadId
   * @param {string} username
   *
   * @returns {array} [ { messageId }, ... ]
   *
   * Throws NotFoundError if:
   *    - username not found
   *    - threadId not found
   *    - username with threadId not found
   */
  static async deleteThread(threadId, username) {
    await this.checkThreadId(threadId, username);

    const idRes = await db.query(
      `SELECT array_agg(m.id) as "ids"
       FROM messages AS m 
       LEFT JOIN inactive_messages AS im
       ON m.id = im.message_id
       WHERE party_id = $1
       AND m.id NOT IN (SELECT message_id
                       FROM inactive_messages
                       WHERE username = $2)`,
      [threadId, username]
    );

    const ids = idRes.rows[0].ids;

    const insertStatements = ids.map((el, i) => `($1, $${i + 2})`);

    const result = await db.query(
      `INSERT INTO inactive_messages (username, message_id)
       VALUES ${insertStatements.join(", ")}
       RETURNING message_id`,
      [username, ...ids]
    );

    return result.rows;
  }

  /** Given messageId and username, deactivates message for user
   *
   * @param {number} messageId
   * @param {string} username
   *
   * @returns {object} {messageid}
   *
   * Throws NotFoundError if:
   *    - messageId not found
   *    - username not found
   *    - threadId not found
   *    - username with threadId not found
   */
  static async deleteMsg(messageId, username) {
    const messageCheck = await db.query(
      `SELECT party_id AS "threadId" FROM messages WHERE id = $1`,
      [messageId]
    );
    const threadId = messageCheck.rows[0]?.threadId;
    if (!threadId) throw new NotFoundError(`No message: ${messageId}`);

    await this.checkThreadId(threadId, username);

    const result = await db.query(
      `INSERT INTO inactive_messages (message_id, username)
                                       VALUES ($1, $2)
                                       RETURNING message_id as "id" `,
      [messageId, username]
    );

    return result.rows[0];
  }
}

module.exports = Message;
