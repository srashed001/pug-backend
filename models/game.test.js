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
      date: expect.any(String),
      time: "12:00:00",
      address: "ga1",
      city: "Fresno",
      state: "CA",
      createdOn: expect.any(Date),
      createdBy: "test1",
      daysDiff: 2,
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

  test("inactive if game is inactive", async function () {
    try {
      await Game.get(testGameIds[3]);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// *********************************************** findAll(searchFilters, isActive, gameStatus)

describe('findAll(searchFilters, isActive, gameStatus)', function(){
  test('returns data on all games if no parameters are passed', async function(){
    const games = await Game.findAll();
    expect(games).toEqual([  
      {
        id: testGameIds[1],
        title: "g2",
        description: "game2",
        date: expect.any(String),
        time: "12:00:02",
        address: "ga2",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 2,
        daysDiff: 3,
        isActive: true
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
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: 2,
        isActive: false
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
        createdOn: expect.any(Date),
        createdBy: "test1",
        players: 2,
        daysDiff: 2,
        isActive: true
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
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: -2,
        isActive: true
      },
    ])
  });

  test('returns data on all inactive games when parameter isActive = false', async function(){
    const games = await Game.findAll({}, false);
    expect(games).toEqual([     
      {
        id: testGameIds[3],
        title: "g4",
        description: "game4",
        date: expect.any(String),
        time: "12:00:04",
        address: "ga4",
        city: "Irvine",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: 2,
        isActive: false
      }
    ])
  });

  test('returns data on all active games when parameter isActive = true', async function(){
    const games = await Game.findAll({}, true);
    expect(games).toEqual([  
      {
        id: testGameIds[1],
        title: "g2",
        description: "game2",
        date: expect.any(String),
        time: "12:00:02",
        address: "ga2",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 2,
        daysDiff: 3,
        isActive: true
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
        createdOn: expect.any(Date),
        createdBy: "test1",
        players: 2,
        daysDiff: 2,
        isActive: true
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
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: -2,
        isActive: true
      },
    ])
  });

  test('returns data on active games with date filter', async function(){
    Date.prototype.addDays = function (days) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() - 7)
      return date;
    };

    let date = new Date();
    date = date.addDays(2).toJSON().slice(0, 10);
    console.log(date)

    const games = await Game.findAll({date}, true);

    expect(games).toEqual([     
      {
        id: testGameIds[0],
        title: "g1",
        description: "game1",
        date: expect.any(String),
        time: "12:00:00",
        address: "ga1",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test1",
        players: 2,
        daysDiff: 2,
        isActive: true
      }
    ])
  });

  test('returns data on inactive games with date filter', async function(){
    Date.prototype.addDays = function (days) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() - 7)
      return date;
    };

    let date = new Date();
    date = date.addDays(2).toJSON().slice(0, 10);

    const games = await Game.findAll({date}, false);
    expect(games).toEqual([     
      {
        id: testGameIds[3],
        title: "g4",
        description: "game4",
        date: expect.any(String),
        time: "12:00:04",
        address: "ga4",
        city: "Irvine",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: 2,
        isActive: false
      }
    ])
  });

  test('returns data on all games with city filter', async function(){
    const games = await Game.findAll({city: 'irvine'});
    expect(games).toEqual([    
      {
        id: testGameIds[3],
        title: "g4",
        description: "game4",
        date: expect.any(String),
        time: "12:00:04",
        address: "ga4",
        city: "Irvine",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: 2,
        isActive: false
      },
    ])
  });

  test('returns data on active games with city filter', async function(){
    const games = await Game.findAll({city: 'irvine'}, true);
    expect(games).toEqual([])
      
  });

  test('returns data on all games with host filter', async function(){
    const games = await Game.findAll({host: 'test3'});
    expect(games).toEqual([   
      {
        id: testGameIds[3],
        title: "g4",
        description: "game4",
        date: expect.any(String),
        time: "12:00:04",
        address: "ga4",
        city: "Irvine",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: 2,
        isActive: false
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
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: -2,
        isActive: true
      },
    ])
  });

  test('returns data on all games with joined filter', async function(){
    const games = await Game.findAll({joined: 'test4'});
    expect(games).toEqual([  
      {
        id: testGameIds[1],
        title: "g2",
        description: "game2",
        date: expect.any(String),
        time: "12:00:02",
        address: "ga2",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 2,
        daysDiff: 3,
        isActive: true
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
        createdOn: expect.any(Date),
        createdBy: "test1",
        players: 2,
        daysDiff: 2,
        isActive: true
      },
    ])
  });

  test('returns data on all games with state filter', async function(){
    const resultGames = await db.query(
      `
          INSERT INTO games(title, description, game_date, game_time, game_address, game_city, game_state, created_by, is_active )
          VALUES  ('g5', 'game5', (CURRENT_DATE + 2)::date, '12:00:05', 'ga5', 'Las Vegas', 'NV', 'test2', true),
                  ('g6', 'game6', (CURRENT_DATE + 3)::date, '12:00:06', 'ga6', 'Reno', 'NV', 'test2', true)
          RETURNING id
      `,
    );

    const newGameIds = resultGames.rows.map(el => el.id)

    const games = await Game.findAll({state: "NV"});
    expect(games).toEqual([  
      {
        id: newGameIds[1],
        title: "g6",
        description: "game6",
        date: expect.any(String),
        time: "12:00:06",
        address: "ga6",
        city: "Reno",
        state: "NV",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 0,
        daysDiff: 3,
        isActive: true
      },    
      {
        id: newGameIds[0],
        title: "g5",
        description: "game5",
        date: expect.any(String),
        time: "12:00:05",
        address: "ga5",
        city: "Las Vegas",
        state: "NV",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 0,
        daysDiff: 2,
        isActive: true
      },
    ])
  });

  test('returns data on active games with state filter', async function(){
    const resultGames = await db.query(
      `
          INSERT INTO games(title, description, game_date, game_time, game_address, game_city, game_state, created_by, is_active )
          VALUES  ('g5', 'game5', (CURRENT_DATE + 2)::date, '12:00:05', 'ga5', 'Las Vegas', 'NV', 'test2', false),
                  ('g6', 'game6', (CURRENT_DATE + 3)::date, '12:00:06', 'ga6', 'Reno', 'NV', 'test2', true)
          RETURNING id
      `,
    );

    const newGameIds = resultGames.rows.map(el => el.id)

    const games = await Game.findAll({state: "NV"}, true);
    expect(games).toEqual([  
      {
        id: newGameIds[1],
        title: "g6",
        description: "game6",
        date: expect.any(String),
        time: "12:00:06",
        address: "ga6",
        city: "Reno",
        state: "NV",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 0,
        daysDiff: 3,
        isActive: true
      },    
    ])
  });

  test('returns data on upcoming games with parameter gameState ="pending"', async function(){
    const games = await Game.findAll(null, null,'pending');
    expect(games).toEqual([  
      {
        id: testGameIds[1],
        title: "g2",
        description: "game2",
        date: expect.any(String),
        time: "12:00:02",
        address: "ga2",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test2",
        players: 2,
        daysDiff: 3,
        isActive: true
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
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: 2,
        isActive: false
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
        createdOn: expect.any(Date),
        createdBy: "test1",
        players: 2,
        daysDiff: 2,
        isActive: true
      },
    ])
  });

  test('returns data on games that have passed with parameter gameState = "resolved"', async function(){
    const games = await Game.findAll(null, null, 'resolved');
    expect(games).toEqual([  
      {
        id: testGameIds[2],
        title: "g3",
        description: "game3",
        date: expect.any(String),
        time: "12:00:03",
        address: "ga3",
        city: "Fresno",
        state: "CA",
        createdOn: expect.any(Date),
        createdBy: "test3",
        players: 0,
        daysDiff: -2,
        isActive: true
      },
    ])
  });


})

// ******************************************** create(data)
describe("create(data)", function () {
  test("creates a game from data and returns game", async function () {
    // function for setting date to 3 days after you run this test
    // value may round up day so select 2 or 3 depending on time of day
    Date.prototype.addDays = function (days) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() - 7)
      return date;
    };

    let date = new Date();
    date = date.addDays(3).toJSON().slice(0, 10);

    const data = {
      title: "g4",
      description: "game4",
      date,
      time: "12:00:04",
      address: "ga4",
      city: "Fresno",
      state: "CA",
      createdBy: "test1",
    };

    const game = await Game.create(data);
    expect(game).toEqual({
      ...data,
      createdOn: expect.any(Date),
      daysDiff: 3,
      id: expect.any(Number),
    });
  });
});

// ******************************************* update(data)

describe("update(data)", function () {
  test("updates all fields if provided", async function () {
    // function for setting date to 3 days after you run this test
    Date.prototype.addDays = function (days) {
      const date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() - 7)
      return date;
    };

    let date = new Date();
    date = date.addDays(3).toJSON().slice(0, 10);

    const data = {
      title: "g4",
      description: "game4",
      date,
      time: "12:00:04",
      address: "ga4",
      city: "Fresno",
      state: "CA",
    };

    const gameUpdate = await Game.update(testGameIds[0], data);
    const updatedGame = await Game.get(testGameIds[0]);
    expect(gameUpdate).toEqual(updatedGame);
  });

  test("updates partial fields", async function () {
    // function for setting date to 3 days after you run this test

    const data = {
      title: "g4",
      description: "game4",
    };

    const gameUpdate = await Game.update(testGameIds[0], data);
    const updatedGame = await Game.get(testGameIds[0]);
    expect(gameUpdate).toEqual(updatedGame);
  });

  test("not found if gameId does not exist", async function () {
    try {
      await Game.update(0, { title: "bananaGame" });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("inactive if updating inactive game", async function () {
    try {
      await Game.update(testGameIds[3], { title: "bananaGame" });
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("bad request if invalid data field provided", async function () {
    try {
      await Game.update(testGameIds[3], { alias: "bananaGame" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// ************************************************ deactivate(gameId)

describe("deactivate(gameId)", function () {
  test("deactivates game with gameId", async function () {
    const foundBeforeDeactivation = await Game.get(testGameIds[0]);
    expect(foundBeforeDeactivation).toMatchObject({ id: testGameIds[0] });

    await Game.deactivate(testGameIds[0]);
    try {
      await Game.get(testGameIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("not found if gameId does not exist", async function () {
    try {
      await Game.deactivate(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ************************************************ reactivate(gameId)

describe("reactivate(gameId)", function () {
  test("reactivates game with gameId", async function () {
    //   testGameId[3] is inactive before reactivation
    try {
      await Game.get(testGameIds[3]);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }

    const gameAferReactivation = await Game.reactivate(testGameIds[3]);

    expect(gameAferReactivation).toEqual({
      id: testGameIds[3],
      title: "g4",
      description: "game4",
      date: expect.any(String),
      time: "12:00:04",
      address: "ga4",
      city: "Irvine",
      state: "CA",
      createdOn: expect.any(Date),
      createdBy: "test3",
      daysDiff: 2,
    });
  });

  test("not found if gameId does not exist", async function () {
    try {
      await Game.reactivate(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ********************************************* getGameComments(gameId, isGameCommentsActive, isUsersActive)

describe("getGameComments(gameId, isGameCommentsActive, isUsersActive)", function () {
  
  test(`returns all game comments with gameId`, async function () {
    const comments = await Game.getGameComments(testGameIds[0]);
    expect(comments).toEqual([
      {
        id: expect.any(Number),
        username: 'test1',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
      {
        id: expect.any(Number),
        username: 'test3',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
      {
        id: expect.any(Number),
        username: 'test4',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
    ]);
  });

  test(`returns all inactive game comments with gameId`, async function () {
    const comments = await Game.getGameComments(testGameIds[0], false);
    expect(comments).toEqual([
      {
        id: expect.any(Number),
        username: 'test4',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
    ]);
  });

  test(`returns active game comments with gameId`, async function () {
    const comments = await Game.getGameComments(testGameIds[0], true);
    expect(comments).toEqual([
      {
        id: expect.any(Number),
        username: 'test1',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
      {
        id: expect.any(Number),
        username: 'test3',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
    ]);
  })

  test(`returns active game comments with gameId where username is active`, async function () {
    const comments = await Game.getGameComments(testGameIds[0], true, true);
    expect(comments).toEqual([
      {
        id: expect.any(Number),
        username: 'test1',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
    ]);
  });

  test(`returns all game comments with gameId where user is active`, async function () {
    const comments = await Game.getGameComments(testGameIds[0], null, true);
    expect(comments).toEqual([
      {
        id: expect.any(Number),
        username: 'test1',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
      {
        id: expect.any(Number),
        username: 'test4',
        comment: 'test comment',
        createdOn: expect.any(Date)
      },
    ]);
  });

  test('bad request if invalid data type is passed to isGameCommentsActive', async function(){
    try{
      await Game.getGameComments(testGameIds[0], 'true');
      fail()
    }catch(err){
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  });


  test('bad request if invalid data type is passed to isUsersActive', async function(){
    try{
      await Game.getGameComments(testGameIds[0], null, 'false');
      fail()
    }catch(err){
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  });


});

// ********************************************* getGamePlayers(gameId)

describe("getGamePlayers(gameId)", function () {
  test(`returns all game players with gameId`, async function () {
    const players = await Game.getGamePlayers(testGameIds[0]);
    expect(players).toEqual(["test4", "test2", "test3"]);
  });

  test(`returns active game players with gameId`, async function () {
    const players = await Game.getGamePlayers(testGameIds[0], true);
    expect(players).toEqual(["test4", "test2"]);
  });

  test(`returns inactive game players with gameId`, async function () {
    const players = await Game.getGamePlayers(testGameIds[0], false);
    expect(players).toEqual(["test3"]);
  });

  test(`returns empty array if no players meet isUsersActive requirement`, async function () {
    const players = await Game.getGamePlayers(testGameIds[2], true);
    expect(players).toEqual([]);
  });

  test("not found if gameId does not exist", async function () {
    try {
      await Game.getGamePlayers(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if invalid data type is passed to isUserActive", async function () {
    try {
      await Game.getGamePlayers(testGameIds[3], 'false');
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// ***************************************** addUserGame(gameId, username)

describe("addUserGame(gameId, username)", function () {
  test("adds active user to active game, returns updated player list", async function () {
    const players = await Game.addUserGame(testGameIds[2], "test1");
    const updatedPlayers = await Game.getGamePlayers(testGameIds[2], true)

    expect(updatedPlayers).toEqual(players)
  });

  test("returns inactive if user is inactive", async function () {
    try {
      await Game.addUserGame(testGameIds[1], "test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("returns inactive if game is inactive", async function () {
    try {
      await Game.addUserGame(testGameIds[1], "test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("returns not found if username does not exist", async function () {
    try {
      await Game.addUserGame(testGameIds[1], "banana");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns not found if game_id does not exist", async function () {
    try {
      await Game.addUserGame(0, "test1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


