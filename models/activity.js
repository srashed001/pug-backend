"use strict";

const db = require("../db");

const { NotFoundError } = require("../expressError");

const {} = require("../helper/sql");

function NotFoundMsgUser(username) {
  return `No user: ${username}`;
}

class Activity {
  /** Given username, returns data on users followers activities and user personal activity
   *
   * @param {string} username
   * @returns {object} {activity: [{primaryUser, secondaryUser, data, game, operation, stamp}, ...],
   *                    myActivity: [{primaryUser, secondaryUser, data, game, operation, stamp}, ...] }
   *
   * Throws NotFoundError, if you username not found
   */
  static async getUserActivity(username) {
    const userCheckRes = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );
    const userCheck = userCheckRes.rows[0];
    if (!userCheck) throw new NotFoundError(NotFoundMsgUser(username));

    const activityRes = await db.query(
      `WITH activity AS (
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM games_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM users_games_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM games_comments_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM is_following_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM users_invites_activity
            )

            SELECT primaryUser, secondaryUser, data, game, operation, stamp 
            FROM activity
            WHERE primaryUser IN (SELECT f.followed_user 
                                  FROM is_following AS f 
                                  LEFT JOIN users AS u
                                  ON f.followed_user = u.username
                                  WHERE following_user = $1
                                  AND u.is_active = true) ORDER BY stamp DESC
            `,
      [username]
    );

    const myActivityRes = await db.query(
      `WITH activity AS (
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM games_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM users_games_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM games_comments_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM is_following_activity
                UNION ALL
                SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM users_invites_activity
            )

            SELECT primaryUser, secondaryUser, data, game, operation, stamp FROM activity WHERE primaryUser = $1 ORDER BY stamp DESC
            `,
      [username]
    );

    return { activity: activityRes.rows, myActivity: myActivityRes.rows };
  }
}

module.exports = Activity;
