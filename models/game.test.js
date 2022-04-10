"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  InactiveError,
  UnauthError,
} = require("../expressError");
const Game = require("./game");

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

const { testGameIds } = require("./_testCommon");

// ************************************************* get(gameId)

describe("get(gameId)", function () {
  test("returns a single game", async function () {
    const game = await Game.get(testGameIds[0]);
    expect(game).toEqual({
      id: testGameIds[0],
      title: "g1",
      description: "game1",
      date: "2000-01-01",
      time: "12:00:00",
      address: "ga1",
      city: "Fresno",
      state: "CA",
      createdOn: expect.any(Date),
      createdBy: "test1",
      isActive: true,
      players: ["test1", "test2"],
    });
  });

  test("not found if gameId does not exist", async function () {
    try {
      await Game.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
