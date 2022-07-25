"use strict";

const db = require("../db");

const { NotFoundError, InactiveError } = require("../expressError");

function NotFoundMsgUser(username) {
  return `No user: ${username}`;
}

function InactiveMsgUser(username) {
  return `User inactive: ${username}`;
}

class Follow {
  /** Given username, returns data on active users username is following
   *
   * @param {string} username
   * @returns {array} username follows these users [{username, firstName, lastName, profileImg, city, state}, ...]
   *
   * throws NotFoundError if username does not exist
   */
  static async getFollows(username) {
    const userCheckRes = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );
    const userCheck = userCheckRes.rows[0];
    if (!userCheck) throw new NotFoundError(NotFoundMsgUser(username));

    const followsRes = await db.query(
      `SELECT f.followed_user AS "username", u.profile_img AS "profileImg", u.current_city AS "city", u.current_state AS "state", u.first_name AS "firstName", u.last_name AS "lastName"
                                           FROM is_following AS f
                                           LEFT JOIN users AS u
                                           ON f.followed_user = u.username 
                                           WHERE f.following_user = $1 AND u.is_active = true
                                           ORDER BY f.followed_user`,
      [username]
    );
    return followsRes.rows;
  }

  /** Given username, returns data on username followers
   *
   * @param {string} username
   * @returns {array} users following username [{username, firstName, lastName, profileImg, city, state}, ...]
   *
   * throws NotFoundError is username does not exist
   */
  static async getFollowers(username) {
    const userCheckRes = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );
    const userCheck = userCheckRes.rows[0];
    if (!userCheck) throw new NotFoundError(NotFoundMsgUser(username));

    const followersRes = await db.query(
      `SELECT f.following_user AS "username", u.profile_img AS "profileImg", u.current_city AS "city", u.current_state AS "state", u.first_name AS "firstName", u.last_name AS "lastName"
                                           FROM is_following AS f
                                           LEFT JOIN users AS u
                                           ON f.following_user = u.username 
                                           WHERE f.followed_user = $1 AND u.is_active = true
                                           ORDER BY f.following_user`,
      [username]
    );
    return !followersRes.rows ? [] : followersRes.rows;
  }
  /** Given follower/followed (username), toggles relationship status, returns action details
   *  if(follower follows followed) => follower unfollows followed
   *  if(follower !follows followed) => follower follows followed
   *
   * @param {string} follower
   * @param {string} followed
   * @returns {object} action details {action, follower, followed, followingProfileImg}
   *  - where action "followed" || "unfollowed"
   *
   * Throws NotFoundError if follower/followed (username) does not exist
   * Throws InactiveError if follower/followed is inactive
   */
  static async toggle(follower, followed) {
    const usersCheck = await db.query(
      `SELECT (SELECT is_active FROM users WHERE username = $1) AS "follower",
                    (SELECT is_active FROM users WHERE username = $2) AS "followed",
                    (SELECT following_user FROM is_following WHERE following_user = $1 AND followed_user = $2 ) AS "is_followed"`,
      [follower, followed]
    );

    const users = usersCheck.rows[0];
    if (users.follower === null)
      throw new NotFoundError(NotFoundMsgUser(follower));
    if (!users.follower) throw new InactiveError(InactiveMsgUser(follower));
    if (users.followed === null)
      throw new NotFoundError(NotFoundMsgUser(followed));
    if (!users.followed) throw new InactiveError(InactiveMsgUser(followed));

    const addQuery = `INSERT INTO is_following (followed_user, following_user)
                             VALUES ($1, $2)
                             RETURNING followed_user AS "followed", 
                                       following_user AS "follower", 
                                       (SELECT profile_img FROM users WHERE username = $2) AS "followingProfileImg"`;

    const removeQuery = `DELETE FROM is_following
                             WHERE followed_user = $1 AND following_user = $2
                             RETURNING followed_user AS "followed", 
                                       following_user AS "follower", 
                                       (SELECT profile_img FROM users WHERE username = $2) AS "followingProfileImg"
                             `;

    const query = users.is_followed ? removeQuery : addQuery;
    const status = users.is_followed ? "unfollowed" : "followed";
    const res = await db.query(query, [followed, follower]);
    res.rows[0].action = status;

    return res.rows[0];
  }
}

module.exports = Follow;
