const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");



let testGameIds = []

async function commonBeforeAll() {
  

  await db.query("DELETE FROM users");
  await db.query("DELETE FROM games");
  await db.query("DELETE FROM users_games");
  await db.query("DELETE FROM games_comments");
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM is_following");
  await db.query("DELETE FROM users_invites");
  await db.query(
    `
        INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
        VALUES  ('test1', 'f1', 'l1', '2000-01-01', 'cc1', 'cs1', 'http://f1.img', $1, 'test1@test.com', true),
                ('test2', 'f2', 'l2', '2000-01-02', 'cc2', 'cs2', 'http://f2.img', $2, 'test2@test.com', true),
                ('test3', 'f3', 'l3', '2000-01-03', 'cc3', 'cs3', 'http://f3.img', $3, 'test3@test.com', false)
    `,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password3", BCRYPT_WORK_FACTOR),
    ]
  );

  const resultGames = await db.query(
    `
        INSERT INTO games(title, description, game_date, game_time, game_address, game_city, game_state, created_by )
        VALUES  ('g1', 'game1', '2000-01-01', '12:00:00', 'ga1', 'Fresno', 'CA', 'test1'),
                ('g2', 'game2', '2000-01-02', '12:00:02', 'ga2', 'Fresno', 'CA', 'test1'),
                ('g3', 'game3', '2000-01-03', '12:00:03', 'ga3', 'Fresno', 'CA', 'test2')
        RETURNING id
    `,
  );

  testGameIds.splice(0,0, ...resultGames.rows.map(r=>r.id))
  await db.query(`
        INSERT INTO users_games(game_id, username)
        VALUES  ($1, 'test1'),
                ($1, 'test2'),
                ($2, 'test1'),
                ($2, 'test2')
    `, [testGameIds[0], testGameIds[1]]);

  await db.query(`
        INSERT INTO games_comments(game_id, username, comment)
        VALUES ($1, 'test1', 'test comment')
    `, [testGameIds[0]]);

  await db.query(`
        INSERT INTO messages (message_to, message_from, message)
        VALUES ('test1', 'test2', 'test message')
    `);

  await db.query(`
        INSERT INTO is_following (followed_user, following_user)
        VALUES  ('test1', 'test2'),
                ('test2', 'test1')
    `);

  await db.query(`
        INSERT INTO users_invites (game_id, from_user, to_user)
        VALUES ($1, 'test3', 'test1')
    `, [testGameIds[2]]);

    return testGameIds
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testGameIds,
};
