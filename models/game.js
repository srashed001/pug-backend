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
            FROM game`
      )
  
  }
//   /** Find all active users.
//    *
//    * Returns [{ username, first_name, last_name, currCity, currState, profile_img, is_private }, ...]
//    **/

//   static async findAll() {
//     const usersRes = await db.query(`
//         SELECT username,
//             first_name AS "firstName", 
//             last_name AS "lastName", 
//             current_city AS "currentCity", 
//             current_state AS "currentState", 
//             profile_img AS "profileImg", 
//             is_private AS "is_private"
//         FROM users
//         WHERE is_active = true
//       `);

//     return usersRes.rows;
//   }

//   /** authenticate user with username, password if user is active.
//    *
//    * Returns {  username,
//    *            first_name,
//    *            last_name,
//    *            birthDate,
//    *            currCity,
//    *            currState,
//    *            profileImg,
//    *            createdOn,
//    *            isPrivate,
//    *            email,
//    *            phoneNumber,
//    *            is_admin,
//    *            isFollowing,
//    *            isFollowed }
//    *
//    *  where isFollowing/isFollowed is [username, ...]
//    *
//    * Throws UnauthorizedError is user not found or wrong password.
//    *
//    * Throws InactiveError if user profile is currently disabled
//    **/

//   static async authenticate(username, password) {
//     const userRes = await db.query(
//       `SELECT username, 
//             first_name AS "firstName",
//             last_name AS "lastName", 
//             birth_date AS "birthDate", 
//             current_city AS "currentCity",
//             current_state AS "currentState", 
//             profile_img AS "profileImg",
//             created_on AS "createdOn",
//             is_private AS "isPrivate",
//             email, 
//             password, 
//             is_admin AS "isAdmin",
//             phone_number AS "phoneNumber",
//             is_active AS "isActive"
//         FROM users 
//         WHERE username = $1`,
//       [username]
//     );

//     const user = userRes.rows[0];

//     if (user) {
//       if (!user.isActive) throw new InactiveError();

//       const isValid = await bcrypt.compare(password, user.password);
//       if (isValid) {
//         delete user.password, delete user.isActive;

//         const followingRes = await db.query(
//           `SELECT f.followed_user 
//           FROM is_following AS f
//           LEFT JOIN users AS u
//           ON f.followed_user = u.username
//           WHERE f.following_user = $1 AND u.is_active = true`,
//           [username]
//         );

//         const followedRes = await db.query(
//           `SELECT f.following_user 
//           FROM is_following AS f
//           LEFT JOIN users AS u
//           ON f.following_user = u.username
//           WHERE followed_user = $1 AND u.is_active = true`,
//           [username]
//         );

//         user.isFollowing = followingRes.rows.map((r) => r.followed_user);
//         user.isFollowed = followedRes.rows.map((r) => r.following_user);

//         return user;
//       }
//     }

//     throw new UnauthError("Invalid username/password");
//   }

//   /** Register user with data.
//    *
//    * Returns {  username,
//    *            first_name,
//    *            last_name,
//    *            birthDate,
//    *            currCity,
//    *            currState,
//    *            profileImg,
//    *            isPrivate,
//    *            email,
//    *            phoneNumber,
//    *            is_admin,
//    *            isFollowing,
//    *            isFollowed }
//    *
//    *  where isFollowing/isFollowed is []
//    *
//    * Throws BadRequestError on duplicates.
//    **/

//   static async register({
//     username,
//     firstName,
//     lastName,
//     birthDate,
//     currentCity,
//     currentState,
//     phoneNumber,
//     profileImg,
//     password,
//     email,
//   }) {
//     const duplicateCheck = await db.query(
//       `SELECT username 
//               FROM users
//               WHERE username = $1`,
//       [username]
//     );

//     if (duplicateCheck.rows[0])
//       throw new BadRequestError(`Username ${username} is already taken`);

//     const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

//     const userRes = await db.query(
//       `INSERT INTO users 
//               (username, first_name, last_name, birth_date, current_city, current_state, phone_number, profile_img, password, email)
//               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//               RETURNING username,
//                         first_name AS "firstName",
//                         last_name AS "lastName", 
//                         birth_date AS "birthDate",
//                         current_city AS "currentCity",
//                         current_state AS "currentState",
//                         profile_img AS "profileImg",
//                         is_private AS "isPrivate",
//                         email,
//                         phone_number AS "phoneNumber",
//                         created_on AS "createdOn", 
//                         is_admin AS "isAdmin"
//                         `,
//       [
//         username,
//         firstName,
//         lastName,
//         birthDate,
//         currentCity,
//         currentState,
//         phoneNumber,
//         profileImg,
//         hashedPassword,
//         email,
//       ]
//     );

//     const user = userRes.rows[0];
//     user.isFollowing = [];
//     user.isFollowed = [];

//     return user;
//   }

//   /** Update user data with `data`.
//    *
//    * This is a "partial update" --- it's fine if data doesn't contain
//    * all the fields; this only changes provided ones.
//    *
//    * Data can include:
//    *   { username, firstName, lastName, birthDate, currentCity, currentState, phoneNumber, profileImg, email, isPrivate }
//    *
//    * Returns { username, firstName, lastName, birthDate, currentCity, currentState, phoneNumber, profileImg, email, isPrivate, isAdmin }
//    *
//    * Throws NotFoundError if not found.
//    *
//    * Throws BadRequestError if invalid fields are provided
//    *
//    * For security purposes this function cannot change passwords or is_admin status
//    * Seperate functions are used for updating those properties
//    */

//   static async update(username, data) {
//     const { setCols, values } = sqlForPartialUpdate(data);

//     if (data.username) {
//       const duplicateCheck = await db.query(
//         "SELECT username FROM users WHERE username = $1",
//         [data.username]
//       );
//       if (duplicateCheck.rows[0])
//         throw new BadRequestError(`Username ${username} is already taken`);
//     }

//     const usernameIdx = "$" + (values.length + 1);

//     const querySql = `UPDATE users
//                             SET ${setCols}
//                             WHERE username = ${usernameIdx}
//                             RETURNING username, 
//                                       first_name AS "firstName",
//                                       last_name AS "lastName", 
//                                       birth_date AS "birthDate", 
//                                       current_city AS "currentCity",
//                                       current_state AS "currentState", 
//                                       phone_number AS "phoneNumber", 
//                                       profile_img AS "profileImg", 
//                                       created_on AS "createdOn",
//                                       email, 
//                                       is_private AS "isPrivate", 
//                                       is_admin AS "isAdmin"`;

//     const result = await db.query(querySql, [...values, username]);
//     const user = result.rows[0];

//     if (!user)
//       throw new NotFoundError(`No active user with username: ${username}`);

//     const followingRes = await db.query(
//       `SELECT f.followed_user 
//         FROM is_following AS f
//         LEFT JOIN users AS u
//         ON f.followed_user = u.username
//         WHERE f.following_user = $1 AND u.is_active = true`,
//       [user.username]
//     );

//     const followedRes = await db.query(
//       `SELECT f.following_user 
//         FROM is_following AS f
//         LEFT JOIN users AS u
//         ON f.following_user = u.username
//         WHERE followed_user = $1 AND u.is_active = true`,
//       [user.username]
//     );

//     user.isFollowing = followingRes.rows.map((r) => r.followed_user);
//     user.isFollowed = followedRes.rows.map((r) => r.following_user);

//     return user;
//   }

//   static async deactivate(username) {
//     const result = await db.query(
//       `UPDATE users
//        SET is_active = false
//        WHERE username = $1
//        RETURNING username`,
//       [username]
//     );
//     const user = result.rows[0];

//     if (!user)
//       throw new NotFoundError(`No active user with username: ${username}`);
//   }
//   /** Updates user password`.
//    * username and old password is required to update password
//    *
//    * Returns { username, firstName, lastName, birthDate, currentCity, currentState, phoneNumber, profileImg, email, isPrivate, isAdmin, createdOn }
//    *
//    * Throws NotFoundError if user not found.
//    *
//    * Throws BadRequestError if invalid credentials are provided
//    *
//    */

//   static async updatePassword(username, oldPassword, newPassword) {
//     const userRes = await db.query(
//       `SELECT password, is_active AS "isActive"
//           FROM users 
//           WHERE username = $1`,
//       [username]
//     );

//     const userCheck = userRes.rows[0];

//     if (!userCheck)
//       throw new NotFoundError(`No active user with username: ${username}`);

//     if (!userCheck.isActive) throw new InactiveError();

//     const isValid = await bcrypt.compare(oldPassword, userCheck.password);
//     if (isValid) {
//       const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_WORK_FACTOR);

//       const userRes = await db.query(
//         `UPDATE users
//             SET password = $1
//             WHERE username = $2
//             RETURNING username, 
//                     first_name AS "firstName",
//                     last_name AS "lastName", 
//                     birth_date AS "birthDate", 
//                     current_city AS "currentCity",
//                     current_state AS "currentState", 
//                     profile_img AS "profileImg",
//                     created_on AS "createdOn",
//                     is_private AS "isPrivate",
//                     email, 
//                     is_admin AS "isAdmin",
//                     phone_number AS "phoneNumber"`,
//         [hashedPassword, username]
//       );

//       const user = userRes.rows[0];

//       const followingRes = await db.query(
//         `SELECT f.followed_user 
//         FROM is_following AS f
//         LEFT JOIN users AS u
//         ON f.followed_user = u.username
//         WHERE f.following_user = $1 AND u.is_active = true`,
//         [username]
//       );

//       const followedRes = await db.query(
//         `SELECT f.following_user 
//         FROM is_following AS f
//         LEFT JOIN users AS u
//         ON f.following_user = u.username
//         WHERE followed_user = $1 AND u.is_active = true`,
//         [username]
//       );

//       user.isFollowing = followingRes.rows.map((r) => r.followed_user);
//       user.isFollowed = followedRes.rows.map((r) => r.following_user);

//       return user;
//     }

//     throw new UnauthError("Invalid password");
//   }

//   /** Updates isAdmin status`.
//    * SECRET_KEY is required to isAdmin status
//    * All registered users are not assigned is admin status, to change requires SECRET_KEY
//    *
//    * Returns { username, firstName, lastName, birthDate, currentCity, currentState, phoneNumber, profileImg, email, isPrivate, isAdmin, createdOn }
//    *
//    * Throws NotFoundError if user not found.
//    *
//    * Throws BadRequestError if invalid key is provided
//    *
//    */

//   static async updateIsAdmin(username, key) {
//     const userRes = await db.query(
//       `SELECT is_admin AS "isAdmin"
//                 FROM users 
//                 WHERE username = $1`,
//       [username]
//     );

//     const userCheck = userRes.rows[0];

//     if (!userCheck)
//       throw new NotFoundError(`No active user with username: ${username}`);

//     const isAdminStatus = userCheck.isAdmin;

//     if (key === SECRET_KEY) {
//       const result = await db.query(
//         `UPDATE users
//                     SET is_admin = $1
//                     WHERE username = $2
//                     RETURNING username, 
//                             first_name AS "firstName",
//                             last_name AS "lastName", 
//                             birth_date AS "birthDate", 
//                             current_city AS "currentCity",
//                             current_state AS "currentState", 
//                             profile_img AS "profileImg",
//                             created_on AS "createdOn",
//                             is_private AS "isPrivate",
//                             email, 
//                             is_admin AS "isAdmin",
//                             phone_number AS "phoneNumber"`,
//         [!isAdminStatus, username]
//       );

//       const user = result.rows[0];

//       const followingRes = await db.query(
//         `SELECT f.followed_user 
//                 FROM is_following AS f
//                 LEFT JOIN users AS u
//                 ON f.followed_user = u.username
//                 WHERE f.following_user = $1 AND u.is_active = true`,
//         [username]
//       );

//       const followedRes = await db.query(
//         `SELECT f.following_user 
//                 FROM is_following AS f
//                 LEFT JOIN users AS u
//                 ON f.following_user = u.username
//                 WHERE followed_user = $1 AND u.is_active = true`,
//         [username]
//       );

//       user.isFollowing = followingRes.rows.map((r) => r.followed_user);
//       user.isFollowed = followedRes.rows.map((r) => r.following_user);

//       return user;
//     }

//     throw new UnauthError("Invalid key");
//   }
}

module.exports = Game;
