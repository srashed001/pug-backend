"use strict";
const db = require("../db");

const { NotFoundError } = require("../expressError");

const Activity = require("./activity");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// ************************************************* getFollowers(username)

describe(`getAllActivity`, function () {
  test(`returns users followers and personal activities`, async function () {
    // test2 follows test1 and test3, however test 3 is inactive
    // activity should return only test1 activity and personal activity
    const { activity, myActivity } = await Activity.getUserActivity("test2");
    const test1ActivityRes = await db.query(
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
      ["test1"]
    );
    const test2ActivityRes = await db.query(
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
      ["test2"]
    );

    expect(activity).toEqual(test1ActivityRes.rows);
    expect(myActivity).toEqual(test2ActivityRes.rows);
  });
  test(`returns not found username does not exist`, async function () {
    try {
      await Activity.getUserActivity("bananaMan");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
