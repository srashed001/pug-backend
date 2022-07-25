"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token,
  u4Token,
  u5Token,
  adminToken,
  testCommentIds,
} = require("../routes/_testCommon");

const Game = require("../models/game");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const { testGameIds } = require("../routes/_testCommon");
const { createToken } = require("../helper/tokens");

// ************************************** POST /games

describe(`POST /games`, function () {
  // function for setting date to 3 days after you run this test
  Date.prototype.addDays = function (days) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() - 7);
    return date;
  };

  let date = new Date();
  date = date.addDays(3).toJSON().slice(0, 10);

  const data = {
    title: "testGame",
    description: "testGame",
    date,
    time: "12:00:04",
    address: "ga4",
    city: "Fresno",
    state: "CA",
  };

  test(`creates game if user logged in`, async function () {
    const resp = await request(app)
      .post(`/games`)
      .send(data)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      details: {
        ...data,
        createdOn: expect.any(String),
        daysDiff: 3,
        createdBy: "test1",
        id: expect.any(Number),
      },
    });
  });

  test(`returns unauth if user is not logged in`, async function () {
    const resp = await request(app).post(`/games`).send(data);

    expect(resp.statusCode).toEqual(401);
  });
});

// *************************************** GET /games

describe(`GET /games`, function () {
  test(`returns all games when no searchfilters provided`, async function () {
    const resp = await request(app).get("/games");
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[1],
          title: "g2",
          description: "game2",
          date: expect.any(String),
          time: "12:00:02",
          address: "ga2",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f2",
            lastName: "l2",
            username: "test2",
          },
          players: ["test1", "test4"],
          daysDiff: 3,
          isActive: true,
        },
        {
          id: testGameIds[3],
          title: "g4",
          description: "game4",
          date: expect.any(String),
          time: "12:00:04",
          address: "ga4",
          city: "Irvine",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: 2,
          isActive: false,
        },
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
        {
          id: testGameIds[2],
          title: "g3",
          description: "game3",
          date: expect.any(String),
          time: "12:00:03",
          address: "ga3",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: -2,
          isActive: true,
        },
      ],
    });
  });

  test(`returns all active games with isActive: true`, async function () {
    const resp = await request(app).get("/games").query({ isActive: true });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[1],
          title: "g2",
          description: "game2",
          date: expect.any(String),
          time: "12:00:02",
          address: "ga2",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f2",
            lastName: "l2",
            username: "test2",
          },
          players: ["test1", "test4"],
          daysDiff: 3,
          isActive: true,
        },
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
        {
          id: testGameIds[2],
          title: "g3",
          description: "game3",
          date: expect.any(String),
          time: "12:00:03",
          address: "ga3",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: -2,
          isActive: true,
        },
      ],
    });
  });

  test(`returns all inactive games with isActive: false`, async function () {
    const resp = await request(app).get("/games").query({ isActive: false });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[3],
          title: "g4",
          description: "game4",
          date: expect.any(String),
          time: "12:00:04",
          address: "ga4",
          city: "Irvine",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: 2,
          isActive: false,
        },
      ],
    });
  });

  test(`throws badrequest if isActive is not passed boolean`, async function () {
    const resp = await request(app).get("/games").query({ isActive: "True" });
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns all 'pending' games with gameStatus: 'pending'`, async function () {
    const resp = await request(app)
      .get("/games")
      .query({ gameStatus: "pending" });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[1],
          title: "g2",
          description: "game2",
          date: expect.any(String),
          time: "12:00:02",
          address: "ga2",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f2",
            lastName: "l2",
            username: "test2",
          },
          players: ["test1", "test4"],
          daysDiff: 3,
          isActive: true,
        },
        {
          id: testGameIds[3],
          title: "g4",
          description: "game4",
          date: expect.any(String),
          time: "12:00:04",
          address: "ga4",
          city: "Irvine",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: 2,
          isActive: false,
        },
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
      ],
    });
  });

  test(`returns all 'resolved' games with gameStatus: 'resolved'`, async function () {
    const resp = await request(app)
      .get("/games")
      .query({ gameStatus: "resolved" });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[2],
          title: "g3",
          description: "game3",
          date: expect.any(String),
          time: "12:00:03",
          address: "ga3",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: -2,
          isActive: true,
        },
      ],
    });
  });

  test(`returns all active 'pending games`, async function () {
    const resp = await request(app)
      .get("/games")
      .query({ isActive: true, gameStatus: "pending" });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[1],
          title: "g2",
          description: "game2",
          date: expect.any(String),
          time: "12:00:02",
          address: "ga2",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f2",
            lastName: "l2",
            username: "test2",
          },
          players: ["test1", "test4"],
          daysDiff: 3,
          isActive: true,
        },
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
      ],
    });
  });

  test(`throws badrequest if gameStatus passed invalid string`, async function () {
    const resp = await request(app)
      .get("/games")
      .query({ gameStatus: "waiting" });
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns all games user hosted`, async function () {
    const resp = await request(app).get("/games").query({ host: "test1" });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
      ],
    });
  });

  test(`returns all games user joined`, async function () {
    const resp = await request(app).get("/games").query({ joined: "test4" });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[1],
          title: "g2",
          description: "game2",
          date: expect.any(String),
          time: "12:00:02",
          address: "ga2",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f2",
            lastName: "l2",
            username: "test2",
          },
          players: ["test1", "test4"],
          daysDiff: 3,
          isActive: true,
        },
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
      ],
    });
  });

  test(`returns all games in a city`, async function () {
    const resultGames = await db.query(
      `
      INSERT INTO games(title, description, game_date, game_time, game_address, game_city, game_state, created_by, is_active )
      VALUES  ('g5', 'game5', (CURRENT_DATE + 2)::date, '12:00:05', 'ga5', 'Irvine', 'NV', 'test5', true),
              ('g6', 'game6', (CURRENT_DATE + 3)::date, '12:00:06', 'ga6', 'Irvine', 'CO', 'test5', true)
      RETURNING id
        `
    );
    const gameIds = resultGames.rows.map((el) => el.id);
    // city is case-insensitive
    const resp = await request(app).get("/games").query({ city: "irvine" });
    expect(resp.body).toEqual({
      games: [
        {
          id: gameIds[1],
          title: "g6",
          date: expect.any(String),
          time: expect.any(String),
          address: "ga6",
          city: "Irvine",
          state: "CO",
          createdBy: { username: "test5", firstName: "f5", lastName: "l5" },
          players: [],
          daysDiff: 3,
          isActive: true,
          createdOn: expect.any(String),
          description: "game6",
        },
        {
          id: gameIds[0],
          title: "g5",
          date: expect.any(String),
          time: expect.any(String),
          address: "ga5",
          city: "Irvine",
          state: "NV",
          createdBy: { username: "test5", firstName: "f5", lastName: "l5" },
          players: [],
          daysDiff: 2,
          isActive: true,
          createdOn: expect.any(String),
          description: "game5",
        },
        {
          id: testGameIds[3],
          title: "g4",
          date: expect.any(String),
          time: expect.any(String),
          address: "ga4",
          city: "Irvine",
          state: "CA",
          createdBy: { username: "test3", firstName: "f3", lastName: "l3" },
          players: [],
          daysDiff: 2,
          isActive: false,
          createdOn: expect.any(String),
          description: "game4",
        },
      ],
    });
  });

  test(`returns all games in a city and state`, async function () {
    const resultGames = await db.query(
      `
      INSERT INTO games(title, description, game_date, game_time, game_address, game_city, game_state, created_by, is_active )
      VALUES  ('g5', 'game5', (CURRENT_DATE + 2)::date, '12:00:05', 'ga5', 'Irvine', 'NV', 'test5', true),
              ('g6', 'game6', (CURRENT_DATE + 3)::date, '12:00:06', 'ga6', 'Irvine', 'CO', 'test5', true)
      RETURNING id
        `
    );
    const gameIds = resultGames.rows.map((el) => el.id);

    const resp = await request(app)
      .get("/games")
      .query({ city: "Irvine", state: "CA" });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[3],
          title: "g4",
          date: expect.any(String),
          time: expect.any(String),
          address: "ga4",
          city: "Irvine",
          state: "CA",
          createdBy: { username: "test3", firstName: "f3", lastName: "l3" },
          players: [],
          daysDiff: 2,
          isActive: false,
          createdOn: expect.any(String),
          description: "game4",
        },
      ],
    });
  });

  test(`throws badrequest if state is not all caps 2 letter abbreviation`, async function () {
    const resp = await request(app).get("/games").query({ state: "ca" });
    expect(resp.statusCode).toEqual(400);
  });

  test(`throws badrequest if passed invalid data`, async function () {
    const resp = await request(app).get("/games").query({ isActive: "active" });
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns all games by date`, async function () {
    //   creates a dynamic date two days after test is run
    Date.prototype.addDays = function (days) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() - 7);
      return date;
    };

    let date = new Date();
    date = date.addDays(2).toJSON().slice(0, 10);

    const resp = await request(app).get("/games").query({ date });
    expect(resp.body).toEqual({
      games: [
        {
          id: testGameIds[3],
          title: "g4",
          description: "game4",
          date: expect.any(String),
          time: "12:00:04",
          address: "ga4",
          city: "Irvine",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f3",
            lastName: "l3",
            username: "test3",
          },
          players: [],
          daysDiff: 2,
          isActive: false,
        },
        {
          id: testGameIds[0],
          title: "g1",
          description: "game1",
          date: expect.any(String),
          time: "12:00:00",
          address: "ga1",
          city: "Fresno",
          state: "CA",
          createdOn: expect.any(String),
          createdBy: {
            firstName: "f1",
            lastName: "l1",
            username: "test1",
          },
          players: ["test2", "test4"],
          daysDiff: 2,
          isActive: true,
        },
      ],
    });
  });

  test(`throws badrequest if passed invalid fields`, async function () {
    const resp = await request(app).get("/games").query({ zip: 92626 });
    expect(resp.statusCode).toEqual(400);
  });
});

// ************************************ GET /games/:gameId

describe(`GET /games/:gameId`, function () {
  test(`returns data with gameId`, async function () {
    const resp = await request(app).get(`/games/${testGameIds[0]}`);
    expect(resp.body).toEqual({
      details: {
        id: testGameIds[0],
        title: "g1",
        description: "game1",
        date: expect.any(String),
        time: "12:00:00",
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(String),
        daysDiff: 2,
      },
      comments: [
        {
          id: expect.any(Number),
          gameId: testGameIds[0],
          username: "test1",
          comment: "test comment",
          createdOn: expect.any(String),
        },
      ],
      players: [
        { username: "test4", profileImg: "http://f4.img" },
        { username: "test2", profileImg: "http://f2.img" },
      ],
    });
  });

  test(`returns notFound if gameId not found`, async function () {
    const resp = await request(app).get(`/games/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

// ************************************ PATCH /games/:gameId

describe(`PATCH /games/:gameId`, function () {
  test(`updates title and returns game details`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ title: "new game title" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      details: {
        id: testGameIds[0],
        title: "new game title",
        description: "game1",
        date: expect.any(String),
        time: expect.any(String),
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(String),
        createdBy: "test1",
        daysDiff: 2,
      },
    });
  });

  test(`returns badRequest if provided invalid data`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ title: 45 })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`updates description and returns game details`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ description: "new description" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      details: {
        id: testGameIds[0],
        title: "g1",
        description: "new description",
        date: expect.any(String),
        time: expect.any(String),
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(String),
        createdBy: "test1",
        daysDiff: 2,
      },
    });
  });

  test(`returns badRequest if provided invalid data`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ description: true })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`updates date and returns game details`, async function () {
    //   creates a dynamic date 4 days after test is run
    Date.prototype.addDays = function (days) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() - 7);
      return date;
    };

    let date = new Date();
    date = date.addDays(4).toJSON().slice(0, 10);

    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ date })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      details: {
        id: testGameIds[0],
        title: "g1",
        description: "game1",
        date,
        time: expect.any(String),
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(String),
        createdBy: "test1",
        daysDiff: 4,
      },
    });
  });

  test(`returns badRequest if provided invalid data`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ date: 20220603 })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`updates time, address, city, state and returns game details`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({
        time: "10:30:00",
        city: "Los Angeles",
        address: `123 Main Street`,
        state: "NV",
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      details: {
        id: testGameIds[0],
        title: "g1",
        description: "game1",
        date: expect.any(String),
        time: "10:30:00",
        address: `123 Main Street`,
        city: "Los Angeles",
        state: "NV",
        createdOn: expect.any(String),
        createdBy: "test1",
        daysDiff: 2,
      },
    });
  });

  test(`returns badRequest if provided invalid data`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({
        time: "10:30:00",
        city: "Los Angeles",
        address: `123 Main Street`,
        state: "California",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badRequest if provided invalid field`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}`)
      .send({ createdBy: "test4" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns notFound if provided gameId that does not exist`, async function () {
    const resp = await request(app)
      .patch(`/games/0`)
      .send({ title: "test" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns unauth if user is not admin or game host`, async function () {
    const resp = await request(app)
      .patch(`/games/0`)
      .send({ title: "test" })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns unauth if user is not logged in`, async function () {
    const resp = await request(app).patch(`/games/0`).send({ title: "test" });
    expect(resp.statusCode).toEqual(404);
  });
});

// ************************************ POST /games/:gameId/comment/:username

describe(`POST /games/:gameId/comment/:username`, function () {
  test("creates new comment with correct user token", async function () {
    const data = {
      comment: "new test comment",
    };
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/comment/test1`)
      .send(data)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      comment: {
        gameId: testGameIds[0],
        id: expect.any(Number),
        username: "test1",
        comment: "new test comment",
        createdOn: expect.any(String),
      },
    });
  });

  test("creates new comment with admin token", async function () {
    const data = {
      comment: "new test comment",
    };
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/comment/test1`)
      .send(data)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      comment: {
        id: expect.any(Number),
        gameId: testGameIds[0],
        username: "test1",
        comment: "new test comment",
        createdOn: expect.any(String),
      },
    });
  });

  test(`return badRequest with invalid data`, async function () {
    const data = {
      comment: 123455,
    };
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/comment/test1`)
      .send(data)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`return not found if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const data = {
      comment: "new test comment",
    };
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/comment/bananaMan`)
      .send(data)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`return not found if gameId does not exist`, async function () {
    const data = {
      comment: "new test comment",
    };
    const resp = await request(app)
      .post(`/games/0/comment/test1`)
      .send(data)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`return unauth user is correct user or admin`, async function () {
    const data = {
      comment: "new test comment",
    };
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/comment/test1`)
      .send(data)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});
// ************************************ DELETE /games/comment/:commentId

describe(`DELETE /games/:gameId/comment/:commentId`, function () {
  test("deletes comment if deleted by game host", async function () {
    let newComment = await Game.addGameComment({
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
    });
    let activeGame1Comments = await Game.getGameComments(
      testGameIds[0],
      true,
      true
    );
    expect(activeGame1Comments).toContainEqual(newComment);

    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/comment/${newComment.id}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      action: "deactivated",
      comment: {
        id: expect.any(Number),
        id: newComment.id,
        username: "test4",
        comment: "new test comment",
        createdOn: expect.any(String),
      },
    });

    let inactiveGame1Comments = await Game.getGameComments(
      testGameIds[0],
      false,
      true
    );
    expect(inactiveGame1Comments).toContainEqual({
      id: newComment.id,
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
      createdOn: expect.any(Date),
    });
  });

  test("deletes comment if deleted by comment creator", async function () {
    let newComment = await Game.addGameComment({
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
    });
    let activeGame1Comments = await Game.getGameComments(
      testGameIds[0],
      true,
      true
    );
    expect(activeGame1Comments).toContainEqual(newComment);

    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/comment/${newComment.id}`)
      .set("authorization", `Bearer ${u4Token}`);

    expect(resp.body).toEqual({
      action: "deactivated",
      comment: {
        id: newComment.id,
        username: "test4",
        comment: "new test comment",
        createdOn: expect.any(String),
      },
    });

    let inactiveGame1Comments = await Game.getGameComments(
      testGameIds[0],
      false,
      true
    );
    expect(inactiveGame1Comments).toContainEqual({
      id: newComment.id,
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
      createdOn: expect.any(Date),
    });
  });

  test("deletes comment if user is admin", async function () {
    let newComment = await Game.addGameComment({
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
    });
    let activeGame1Comments = await Game.getGameComments(
      testGameIds[0],
      true,
      true
    );
    expect(activeGame1Comments).toContainEqual(newComment);

    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/comment/${newComment.id}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      action: "deactivated",
      comment: {
        id: newComment.id,
        username: "test4",
        comment: "new test comment",
        createdOn: expect.any(String),
      },
    });

    let inactiveGame1Comments = await Game.getGameComments(
      testGameIds[0],
      false,
      true
    );
    expect(inactiveGame1Comments).toContainEqual({
      id: newComment.id,
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
      createdOn: expect.any(Date),
    });
  });

  test("unauth with incorrect user token", async function () {
    let newComment = await Game.addGameComment({
      gameId: testGameIds[0],
      username: "test4",
      comment: "new test comment",
    });
    let activeGame1Comments = await Game.getGameComments(
      testGameIds[0],
      true,
      true
    );
    expect(activeGame1Comments).toContainEqual(newComment);

    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/comment/${newComment.id}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`return not found if commentId does not exist`, async function () {
    const resp = await request(app).delete(
      `/games/${testGameIds[0]}/comment/0`
    );
    expect(resp.statusCode).toEqual(404);
  });

  test(`return bad request if comment and game don't match`, async function () {
    const resp = await request(app).delete(
      `/games/${testGameIds[2]}/comment/${testCommentIds[0]}`
    );
    expect(resp.statusCode).toEqual(400);
  });
});

// ************************************ POST/games/:gameId/join/:username

describe(`POST /games/:gameId/:username`, function () {
  test(`adds user to game return updated game list`, async function () {
    let players = await Game.getGamePlayers(testGameIds[0], true);
    expect(players).toEqual([
      { profileImg: "http://f4.img", username: "test4" },
      { profileImg: "http://f2.img", username: "test2" },
    ]);

    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/join/test5`)
      .set("authorization", `Bearer ${u5Token}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      players: [
        { username: "test4", profileImg: "http://f4.img" },
        { username: "test2", profileImg: "http://f2.img" },
        { username: "test5", profileImg: "http://f5.img" },
      ],
    });

    players = await Game.getGamePlayers(testGameIds[0], true);
    expect(resp.body.players).toEqual(players);
  });

  test(`returns notFound if gameId does not exist`, async function () {
    const resp = await request(app)
      .post(`/games/0/join/test5`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/join/bananaMan`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns inactive if gameId is inactive`, async function () {
    const resp = await request(app)
      .post(`/games/${testGameIds[3]}/join/test5`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test(`returns inactive if username is inactive`, async function () {
    const resp = await request(app)
      .post(`/games/${testGameIds[0]}/join/test3`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(403);
  });
});

// ************************************ DELETE /games/:gameId/join/:username

describe(`DELETE /games/:gameId/:username`, function () {
  test(`removes user from game with correct user token`, async function () {
    let players = await Game.getGamePlayers(testGameIds[0], true);
    expect(players).toEqual([
      { profileImg: "http://f4.img", username: "test4" },
      { profileImg: "http://f2.img", username: "test2" },
    ]);

    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/join/test2`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.body).toEqual({
      players: [{ profileImg: "http://f4.img", username: "test4" }],
    });

    players = await Game.getGamePlayers(testGameIds[0], true);
    expect(resp.body.players).toEqual(players);
  });

  test(`removes user from game with admin token`, async function () {
    let players = await Game.getGamePlayers(testGameIds[0], true);
    expect(players).toEqual([
      { profileImg: "http://f4.img", username: "test4" },
      { profileImg: "http://f2.img", username: "test2" },
    ]);

    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/join/test2`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      players: [{ profileImg: "http://f4.img", username: "test4" }],
    });

    players = await Game.getGamePlayers(testGameIds[0], true);
    expect(resp.body.players).toEqual(players);
  });

  test(`returns unauth with incorrect token`, async function () {
    const resp = await request(app)
      .delete(`/games/0/join/test5`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth if not logged in`, async function () {
    const resp = await request(app).delete(`/games/0/join/test5`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if gameId does not exist`, async function () {
    const resp = await request(app)
      .delete(`/games/0/join/test5`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/join/bananaMan`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns inactive if gameId is inactive`, async function () {
    const resp = await request(app)
      .delete(`/games/${testGameIds[3]}/join/test5`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test(`returns inactive if username is inactive`, async function () {
    const resp = await request(app)
      .delete(`/games/${testGameIds[0]}/join/test3`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(403);
  });
});

// ************************************ PATCH /games/:gameId/deactivate

describe(`PATCH /games/:gameId/deactivate`, function () {
  test(`deactivates game with game host token`, async function () {
    // testGameId[0] is active game
    let activeGames = await Game.findAll({ isActive: true });
    let activeGameIds = activeGames.map((el) => el.id);
    expect(activeGameIds).toContainEqual(testGameIds[0]);

    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}/deactivate`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      action: "deactivated",
      game: {
        id: testGameIds[0],
        title: "g1",
        description: "game1",
        date: expect.any(String),
        time: "12:00:00",
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(String),
        isActive: false,
        daysDiff: 2,
      },
    });

    let inactiveGames = await Game.findAll({ isActive: false });
    let inactiveGameIds = inactiveGames.map((el) => el.id);
    expect(inactiveGameIds).toContainEqual(testGameIds[0]);
  });

  test(`deactivates game with admin token`, async function () {
    // testGameId[0] is active game
    let activeGames = await Game.findAll({ isActive: true });
    let activeGameIds = activeGames.map((el) => el.id);
    expect(activeGameIds).toContainEqual(testGameIds[0]);

    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}/deactivate`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      action: "deactivated",
      game: {
        id: testGameIds[0],
        title: "g1",
        description: "game1",
        date: expect.any(String),
        time: "12:00:00",
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(String),
        isActive: false,
        daysDiff: 2,
      },
    });

    let inactiveGames = await Game.findAll({ isActive: false });
    let inactiveGameIds = inactiveGames.map((el) => el.id);
    expect(inactiveGameIds).toContainEqual(testGameIds[0]);
  });

  test(`unauth with incorrect token`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[0]}/deactivate`)
      .set("authorization", `Bearer ${u5Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if gameId does not exist`, async function () {
    const resp = await request(app).patch(`/games/0/deactivate`);
    expect(resp.statusCode).toEqual(404);
  });
});

// ************************************ PATCH /games/:gameId/reactivate

describe(`PATCH /games/:gameId/reactivate`, function () {
  test(`reactivates game with game host token`, async function () {
    // testGameId[3] is inactive game
    let inactiveGames = await Game.findAll({ isActive: false });
    let inactiveGameIds = inactiveGames.map((el) => el.id);
    expect(inactiveGameIds).toContainEqual(testGameIds[3]);

    const resp = await request(app)
      .patch(`/games/${testGameIds[3]}/reactivate`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({
      action: "reactivated",
      game: {
        id: testGameIds[3],
        title: "g4",
        description: "game4",
        date: expect.any(String),
        time: "12:00:04",
        address: "ga4",
        city: "Irvine",
        state: "CA",
        createdOn: expect.any(String),
        isActive: true,
        daysDiff: 2,
      },
    });

    let activeGames = await Game.findAll({ isActive: true });
    let activeGameIds = activeGames.map((el) => el.id);
    expect(activeGameIds).toContainEqual(testGameIds[3]);
  });

  test(`reactivates game with admin token`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[3]}/reactivate`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      action: "reactivated",
      game: {
        id: testGameIds[3],
        title: "g4",
        description: "game4",
        date: expect.any(String),
        time: "12:00:04",
        address: "ga4",
        city: "Irvine",
        state: "CA",
        createdOn: expect.any(String),
        isActive: true,
        daysDiff: 2,
      },
    });

    let activeGames = await Game.findAll({ isActive: true });
    let activeGameIds = activeGames.map((el) => el.id);
    expect(activeGameIds).toContainEqual(testGameIds[3]);
  });

  test(`return unauth with incorrect token`, async function () {
    const resp = await request(app)
      .patch(`/games/${testGameIds[3]}/reactivate`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);

    // testGameIds[3] still inactive
    let inactiveGames = await Game.findAll({ isActive: false });
    let inactiveGameIds = inactiveGames.map((el) => el.id);
    expect(inactiveGameIds).toContainEqual(testGameIds[3]);
  });

  test(`returns notFound if gameId does not exist`, async function () {
    const resp = await request(app).patch(`/games/0/reactivate`);
    expect(resp.statusCode).toEqual(404);
  });
});
