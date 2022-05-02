"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");

const {
  NotFoundError,
  BadRequestError,
  UnauthError,
  InactiveError,
} = require("../expressError");

const { sqlForPartialUpdate, sqlForUsersFilters } = require("../helper/sql");

const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");

function NotFoundMsg(username) {
  return `No user: ${username}`;
}

function InactiveMsg(username) {
  return `User profile Inactive: ${username}`;
}

class User {
  /** Given a username, return data about user if user is_active.
   *
   * @param {string} username
   * @returns {object} { username,
   *                     first_name,
   *                     last_name,
   *                     birthDate,
   *                     city,
   *                     state,
   *                     profileImg,
   *                     createdOn,
   *                     isPrivate,
   *                     following,
   *                     followed }
   *   where isFollowing/isFollowed is [username, ...]
   *
   * Throws NotFoundError if user not found.
   * Throws InactiveError if user is inactive
   **/
  static async get(username) {
    const followingQuery = `
    SELECT array_remove(array_agg(f.followed_user), NULL ) AS "following"
    FROM is_following AS f
    LEFT JOIN users AS u
    ON f.followed_user = u.username
    WHERE f.following_user = $1 AND u.is_active = true
    GROUP BY f.following_user`;

    const followedQuery = `
    SELECT array_remove(array_agg(f.following_user), NULL ) AS "followed" 
    FROM is_following AS f
    LEFT JOIN users AS u
    ON f.following_user = u.username
    WHERE followed_user = $1 AND u.is_active = true
    GROUP BY f.followed_user`;

    const userRes = await db.query(
      `SELECT username, 
              first_name AS "firstName",
              last_name AS "lastName", 
              birth_date AS "birthDate", 
              current_city AS "city",
              current_state AS "state", 
              profile_img AS "profileImg",
              created_on AS "createdOn",
              is_private AS "isPrivate",
              is_active,
              email, 
              is_admin AS "isAdmin",
              phone_number AS "phoneNumber",
              (${followedQuery}),
              (${followingQuery})
        FROM users 
        WHERE username = $1`,
      [username]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(NotFoundMsg(username));

    if (!user.is_active) throw new InactiveError(InactiveMsg(username));
    delete user.is_active;

    user.following = user.following ? user.following : [];
    user.followed = user.followed ? user.followed : [];

    return user;
  }

  /** returns all user data, unless passed searchFilters or isActive filter
   *
   * @param {object} searchFilters
   * - username => returns list ordered by username
   * - firstName => returns list ordered by similarity
   * - lastName => returns list ordered by lastName
   * - city => returns list where trigram similarity is > .4
   * - state => returns list where state is exact match
   * - isActive
   *    - undefined/null => returns all users
   *    - true => returns active users
   *    - false => returns inactive users
   *
   * @returns {array} users [{username, firstName, lastName, city, state, profileImg, isPrivate}, ...]
   *
   */
  static async findAll(searchFilters = {}) {
    const findAllQuery = `
        SELECT username,
            first_name AS "firstName", 
            last_name AS "lastName", 
            current_city AS "city", 
            current_state AS "state", 
            profile_img AS "profileImg", 
            is_private AS "isPrivate"
        FROM users
      `;

    const [query, values] = sqlForUsersFilters(findAllQuery, searchFilters);
    // return query
    const usersRes = await db.query(query, values);

    return usersRes.rows;
  }

  /** authenticate user with username, password if user is active.
   *
   * @param {string} username
   * @param {string} password
   *
   * @returns {object} {  username, isAdmin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   * Throws InactiveError if user profile is currently disabled
   **/
  static async authenticate(username, password) {
    const userRes = await db.query(
      `SELECT username, 
              password, 
              is_active AS "isActive",
              is_admin AS "isAdmin"
        FROM users 
        WHERE username = $1`,
      [username]
    );

    const user = userRes.rows[0];

    if (user) {
      if (!user.isActive) throw new InactiveError(InactiveMsg(username));

      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password, delete user.isActive;
        return user;
      }
    }

    throw new UnauthError("Invalid username/password");
  }

  /** Register user with data
   * 
   * @param {object} data
   *    where data = { username,
                       firstName,
                       lastName,
                       birthDate,
                       city,
                       state,
                       phoneNumber,
                       password,
                       email }
   *
   * @returns {object} {  username, isAdmin }
   *
   *
   * Throws BadRequestError if selected a duplicate username.
   **/
  static async register({
    username,
    firstName,
    lastName,
    birthDate,
    city,
    state,
    phoneNumber,
    password,
    email,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username 
              FROM users
              WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Username ${username} is already taken`);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const userRes = await db.query(
      `INSERT INTO users 
              (username, first_name, last_name, birth_date, current_city, current_state, phone_number, password, email)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING username,
                        is_admin AS "isAdmin"
                        `,
      [
        username,
        firstName,
        lastName,
        birthDate,
        city,
        state,
        phoneNumber,
        hashedPassword,
        email,
      ]
    );

    const user = userRes.rows[0];

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * @param {obj} data
   * Data can include:
   *   { username,
   *     firstName,
   *     lastName,
   *     birthDate,
   *     city,
   *     state,
   *     phoneNumber,
   *     profileImg,
   *     email,
   *     isPrivate }
   *
   * @returns {obj} { username,
   *                  firstName,
   *                  lastName,
   *                  birthDate,
   *                  city,
   *                  state,
   *                  phoneNumber,
   *                  profileImg,
   *                  createdOn,
   *                  email,
   *                  isPrivate,
   *                  isAdmin,
   *                  following
   *                  followed }
   *
   * Throws NotFoundError if not found.
   *
   * Throws BadRequestError if invalid fields are provided
   * Throws BadRequestError if updating username with existing username
   *
   * For security purposes this function cannot change passwords or is_admin status
   * Seperate functions are used for updating those properties
   */

  static async update(username, data) {
    const jsToSql = {
      username: "username",
      firstName: "first_name",
      lastName: "last_name",
      birthDate: "birth_date",
      city: "current_city",
      state: "current_state",
      phoneNumber: "phone_number",
      profileImg: "profile_img",
      email: "email",
      isPrivate: "is_private",
    };

    const { setCols, values } = sqlForPartialUpdate(data, jsToSql);

    if (data.username) {
      const duplicateCheck = await db.query(
        "SELECT username FROM users WHERE username = $1",
        [data.username]
      );
      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Username ${username} is already taken`);
    }

    const usernameIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users
                            SET ${setCols}
                            WHERE username = ${usernameIdx}
                            RETURNING username, 
                                      first_name AS "firstName",
                                      last_name AS "lastName", 
                                      birth_date AS "birthDate", 
                                      current_city AS "city",
                                      current_state AS "state", 
                                      phone_number AS "phoneNumber", 
                                      profile_img AS "profileImg", 
                                      created_on AS "createdOn",
                                      email, 
                                      is_private AS "isPrivate", 
                                      is_admin AS "isAdmin"`;

    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(NotFoundMsg(username));

    const followRes = await db.query(
      `SELECT
      (SELECT array_remove(array_agg(f.followed_user), NULL ) AS "following"
        FROM is_following AS f
        LEFT JOIN users AS u
        ON f.followed_user = u.username
        WHERE f.following_user = $1 AND u.is_active = true
        GROUP BY f.followed_user),

        (SELECT array_remove(array_agg(f.following_user), NULL ) AS "followed"
        FROM is_following AS f
        LEFT JOIN users AS u
        ON f.following_user = u.username
        WHERE f.followed_user = $1 AND u.is_active = true
        GROUP BY f.followed_user)
        `,
      [user.username]
    );

    user.following = followRes.rows[0].following
      ? followRes.rows[0].following
      : [];
    user.followed = followRes.rows[0].followed
      ? followRes.rows[0].followed
      : [];

    return user;
  }

  /** Reactivates user with username
   * allows user to recover deactivated account
   *
   * @param {*} username
   * @return {undefined}
   *
   * * NotFound if username does not exist
   */
  static async reactivate(username) {
    const result = await db.query(
      `UPDATE users
       SET is_active = true
       WHERE username = $1
       RETURNING username`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(NotFoundMsg(username));
  }

  /** Deactivates user with username
   * equivalent to deleting profile, however, this allows user to recover account
   *
   * @param {*} username
   * @return {undefined}
   *
   * * NotFound if username does not exist
   */
  static async deactivate(username) {
    const result = await db.query(
      `UPDATE users
       SET is_active = false
       WHERE username = $1
       RETURNING username`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(NotFoundMsg(username));
  }

  /** Updates user password with username, old password, and new password`.
   * username and old password is required to update password
   *
   * @param {string} username
   * @param {string} oldPassword
   * @param {string} newPassword
   *
   * @returns {undefined}
   *
   * Throws NotFoundError if user not found.
   * Throws BadRequestError if invalid credentials are provided
   *
   */
  static async updatePassword(username, oldPassword, newPassword) {
    const userRes = await db.query(
      `SELECT password, is_active AS "isActive"
          FROM users 
          WHERE username = $1`,
      [username]
    );

    const userCheck = userRes.rows[0];

    if (!userCheck) throw new NotFoundError(NotFoundMsg(username));

    if (!userCheck.isActive) throw new InactiveError(InactiveMsg(username));

    const isValid = await bcrypt.compare(oldPassword, userCheck.password);
    if (isValid) {
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_WORK_FACTOR);

      const userRes = await db.query(
        `UPDATE users
            SET password = $1
            WHERE username = $2
            RETURNING username`,
        [hashedPassword, username]
      );

      if (userRes.rows[0]) return;
    }

    throw new UnauthError("Invalid password");
  }

  /** Updates isAdmin status`.
   * SECRET_KEY is required to isAdmin status
   * All registered users is_admin defaults to false, to change requires SECRET_KEY
   *
   * @param {string} username
   * @param {string} key = SECRET_KEY
   * @returns {object} { username,
   *                     firstName,
   *                     lastName,
   *                     birthDate,
   *                     city,
   *                     state,
   *                     phoneNumber,
   *                     profileImg,
   *                     email,
   *                     isPrivate,
   *                     isAdmin,
   *                     createdOn }
   *
   * Throws NotFoundError if user not found.
   * Throws BadRequestError if invalid key is provided
   *
   */
  static async updateIsAdmin(username, key) {
    const userRes = await db.query(
      `SELECT is_admin AS "isAdmin"
                FROM users 
                WHERE username = $1`,
      [username]
    );

    const userCheck = userRes.rows[0];

    if (!userCheck) throw new NotFoundError(NotFoundMsg(username));

    const isAdminStatus = userCheck.isAdmin;

    if (key === SECRET_KEY) {
      const result = await db.query(
        `UPDATE users
                    SET is_admin = $1
                    WHERE username = $2
                    RETURNING username, 
                            first_name AS "firstName",
                            last_name AS "lastName", 
                            birth_date AS "birthDate", 
                            current_city AS "city",
                            current_state AS "state", 
                            profile_img AS "profileImg",
                            created_on AS "createdOn",
                            is_private AS "isPrivate",
                            email, 
                            is_admin AS "isAdmin",
                            phone_number AS "phoneNumber"`,
        [!isAdminStatus, username]
      );

      const user = result.rows[0];

      const followRes = await db.query(
        `SELECT
        (SELECT array_remove(array_agg(f.followed_user), NULL ) AS "following"
          FROM is_following AS f
          LEFT JOIN users AS u
          ON f.followed_user = u.username
          WHERE f.following_user = $1 AND u.is_active = true
          GROUP BY f.followed_user),

          (SELECT array_remove(array_agg(f.following_user), NULL ) AS "followed"
          FROM is_following AS f
          LEFT JOIN users AS u
          ON f.following_user = u.username
          WHERE f.followed_user = $1 AND u.is_active = true
          GROUP BY f.followed_user)
          `,
        [user.username]
      );

      user.following = followRes.rows[0].following
        ? followRes.rows[0].following
        : [];
      user.followed = followRes.rows[0].followed
        ? followRes.rows[0].followed
        : [];

      return user;
    }

    throw new UnauthError("Invalid key");
  }
}

module.exports = User;
