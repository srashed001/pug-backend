"use strict";

const {
  BadRequestError,
  NotFoundError,
  InactiveError,
  UnauthError,
} = require("../expressError");
const Game = require("./game");
const Invite = require("./invite");

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


// ***************************************** createGroup({gameId, fromUser, usersArr})

describe(`createGroup({gameId, fromUser, usersArr})`, function(){
  test(`sends invites to all users in usersArr`, async function(){
    // using testGameId[1] because it currently has no invites
    const groupInvites = await Invite.createGroup({
      gameId: testGameIds[1],
      fromUser: 'test2',
      usersArr: ['test1', 'test4', 'test5']
    })
    expect(groupInvites).toEqual([
      {
        id: expect.any(Number),
        toUser: 'test1',
        createdOn: expect.any(Date),
        gameId: testGameIds[1]
      },
      {
        id: expect.any(Number),
        toUser: 'test4',
        createdOn: expect.any(Date),
        gameId: testGameIds[1]
      },
      {
        id: expect.any(Number),
        toUser: 'test5',
        createdOn: expect.any(Date),
        gameId: testGameIds[1]
      }
    ])
    

    const game2invites = await Invite.getAllGameInvites(testGameIds[1])
    expect(groupInvites.map(el => el.id)).toEqual(game2invites.map(el => el.id))
  });

  test(`returns notFound if fromUser does not exist`, async function(){
    try{
      await Invite.createGroup({
        gameId: testGameIds[1],
        fromUser: 'bananaMan',
        usersArr: ['test1', 'test4', 'test5']
      })
      fail();
    } catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })

  test(`returns notFound if user in usersArr does not exist`, async function(){
    try{
      await Invite.createGroup({
        gameId: testGameIds[1],
        fromUser: 'test2',
        usersArr: ['test1', 'test4', 'bananaMan']
      })
      fail();
    } catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })

  test(`returns notFound if gameId does not exist`, async function(){
    try{
      await Invite.createGroup({
        gameId: 0,
        fromUser: 'test2',
        usersArr: ['test1', 'test4']
      })
      fail();
    } catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })

  test(`returns inactive if gameId is inactive`, async function(){
    try{
      await Invite.createGroup({
        gameId: testGameIds[3],
        fromUser: 'test2',
        usersArr: ['test1', 'test4']
      })
      fail();
    } catch(err){
      expect(err instanceof InactiveError).toBeTruthy()
    }
  })
});

// ***************************************** create(data)

describe("create(data)", function () {
  test("creates invite to user for game", async function () {
    const data = {
      gameId: testGameIds[0],
      fromUser: "test1",
      toUser: "test5",
    };
    const gameInvitesBefore = await Invite.getGameInvites(testGameIds[0]);
    expect(gameInvitesBefore).not.toContainEqual({
      id: expect.any(Number),
      toUser: "test5",
      createdOn: expect.any(Date),
    });

    const newInvite = await Invite.create(data);
    expect(newInvite).toEqual({
      id: expect.any(Number),
      toUser: "test5",
      gameId: testGameIds[0],
      createdOn: expect.any(Date),
    });

    const gameInvitesAfter = await Invite.getGameInvites(testGameIds[0]);
    expect(gameInvitesAfter).toContainEqual({
      id: expect.any(Number),
      toUser: "test5",
      createdOn: expect.any(Date),
    });
  });

  test("returns bad request if user already has pending invite to same game from active user", async function () {
    // test2 already has pending invite to game(testGameId[0]) from test1
    const data = {
      gameId: testGameIds[0],
      fromUser: "test5",
      toUser: "test2",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("creates a duplicate users_invite only if pending is only from inactive user", async function () {
    // test4 has one pending invite to testGameId[2] from inactive user test3
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };

    const gameInvitesBefore = await Invite.getGameInvites(testGameIds[2]);
    expect(gameInvitesBefore).not.toContainEqual({
      id: expect.any(Number),
      toUser: "test4",
      createdOn: expect.any(Date),
    });

    const newInvite = await Invite.create(data);
    expect(newInvite).toEqual({
      id: expect.any(Number),
      toUser: "test4",
      createdOn: expect.any(Date),
      gameId: testGameIds[2]
    });

    const gameInvitesAfter = await Invite.getGameInvites(testGameIds[2]);
    expect(gameInvitesAfter).toContainEqual({
      id: newInvite.id,
      toUser: "test4",
      createdOn: expect.any(Date),
    });
  });

  test("returns not found if gameId does not exist", async function () {
    const data = {
      gameId: 0,
      fromUser: "test2",
      toUser: "test4",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if game is inactive", async function () {
    const data = {
      gameId: testGameIds[3],
      fromUser: "test2",
      toUser: "test4",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("returns not found if from_user username does not exist", async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "bananaMan",
      toUser: "test4",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if from_user is inactive", async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test3",
      toUser: "test4",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("returns not found to_user username does not exist", async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "bananaMan",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if to_user is inactive", async function () {
    const data = {
      gameId: testGameIds[3],
      fromUser: "test2",
      toUser: "test3",
    };

    try {
      await Invite.create(data);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// ***************************************** get(inviteId)

describe("get(inviteId)", function () {
  test("returns data on user_invite with inviteId", async function () {
    const data = {
      gameId: testGameIds[0],
      fromUser: "test1",
      toUser: "test5",
    };

    const newInvite = await Invite.create(data);
    const getInvite = await Invite.get(newInvite.id);
    expect(getInvite).toEqual({
      id: expect.any(Number),
      gameId: testGameIds[0],
      fromUser: "test1",
      toUser: "test5",
      status: "pending",
      createdOn: expect.any(Date),
    });
  });

  test("returns not found if inviteId does not exist", async function () {
    try {
      await Invite.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// **************************************** getAllGameInvites(gameId)

describe("getAllGameInvites(gameId)", function () {
  test(`returns all invites to game, including inactive user invites`, async function () {
    // test3 is inactive but invite still appears
    const invites = await Invite.getAllGameInvites(testGameIds[0]);
    expect(invites).toEqual([
      {
        id: expect.any(Number),
        fromUser: "test1",
        toUser: "test4",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        fromUser: "test1",
        toUser: "test3",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        fromUser: "test1",
        toUser: "test2",
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test(`returns not found if gameId does not exist`, async function () {
    try {
      await Invite.getAllGameInvites(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns inactive if game is inactive`, async function () {
    try {
      await Invite.getAllGameInvites(testGameIds[3]);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// ***************************************** getAllInvitesSent(username)

describe("getAllInvitesSent(username)", function () {
  test("returns all invites sent from user", async function () {
    // data for inactive user 'test3' and inactive game testGameId[3] are still returned
    const invitesSent = await Invite.getAllInvitesSent("test1");
    expect(invitesSent).toEqual([
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        toUser: "test4",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        toUser: "test3",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        toUser: "test2",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        gameId: testGameIds[3],
        toUser: "test4",
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test("returns not found if username does not exist", async function () {
    try {
      await Invite.getAllInvitesSent("bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if user is inactive", async function () {
    try {
      await Invite.getAllInvitesSent("test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});
// ***************************************** getInvitesSent(username)

describe("getInvitesSent(username)", function () {
  test("returns invites sent for active games to active user with username", async function () {
    // 'test3' was sent invite, however its data is not returned because user inactive
    // an active user sent invite for game4 which is not active, data on that ganme is not returned
    const invitesSent = await Invite.getInvitesSent("test1");
    expect(invitesSent).toEqual([
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        toUser: "test4",
        fromUser: "test1",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        toUser: "test2",
        fromUser: "test1",
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test("returns not found if username does not exist", async function () {
    try {
      await Invite.getInvitesSent("bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if user is inactive", async function () {
    try {
      await Invite.getInvitesSent("test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// ***************************************** getAllInvitesReceived(username)

describe("getAllInvitesReceived(username)", function () {
  test("returns all invites sent to active user", async function () {
    // data for inactive user 'test3' and inactive game testGameId[3] are still returned
    const invitesReceived = await Invite.getAllInvitesReceived("test4");
    expect(invitesReceived).toEqual([
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        fromUser: "test1",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        gameId: testGameIds[3],
        fromUser: "test1",
        status: "pending",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        gameId: testGameIds[2],
        fromUser: "test3",
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test("returns not found if username does not exist", async function () {
    try {
      await Invite.getAllInvitesReceived("bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if user is inactive", async function () {
    try {
      await Invite.getAllInvitesReceived("test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});
// ***************************************** getInvitesReceived(username)

describe("getInvitesReceived(username)", function () {
  test("returns invites sent to active user with username", async function () {
    // 'test3' sent invite, however its data is not returned because user inactive
    // an active user sent invite for game4 which is not active, data on that ganme is not returned
    const invitesReceived = await Invite.getInvitesReceived("test4");
    expect(invitesReceived).toEqual([
      {
        id: expect.any(Number),
        gameId: testGameIds[0],
        fromUser: "test1",
        status: "pending",
        createdOn: expect.any(Date),
        toUser: 'test4'
      },
    ]);
  });

  test("returns not found if username does not exist", async function () {
    try {
      await Invite.getInvitesReceived("bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if user is inactive", async function () {
    try {
      await Invite.getInvitesReceived("test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// ***************************************** getGameInvites(username)

describe("getGameInvites(gameId)", function () {
  test("returns 'pending' invites to active users for a game", async function () {
    // 'test3' was sent invite, however its data is not returned because user inactive
    const gameInvites = await Invite.getGameInvites(testGameIds[0]);
    expect(gameInvites).toEqual([
      {
        id: expect.any(Number),
        toUser: "test4",
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        toUser: "test2",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test("does not return pending invites from inactive users", async function () {
    // 'test3' sent an invite to 'test4' for game(testGameId[2])
    const gameInvites = await Invite.getGameInvites(testGameIds[2]);
    expect(gameInvites).toEqual([]);
  });

  test("returns not found if gameId does not exist", async function () {
    try {
      await Invite.getGameInvites(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if game is inactive", async function () {
    try {
      await Invite.getGameInvites(testGameIds[3]);
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// ****************************************** update(inviteId, status)

describe(`update(inviteId, username, status)`, function () {
  test(`updates 'pending' invite to 'cancelled' with correct user`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");

    const updatedInvite = await Invite.update(newInvite.id, 'test2', "cancelled");
    expect(updatedInvite.status).toEqual("cancelled");
  });

  test(`updates 'pending' invite to 'accepted' with correct user
        and adds game`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");

    const updatedInvite = await Invite.update(newInvite.id, 'test4', "accepted");
    expect(updatedInvite.status).toEqual("accepted");

    const game3players = await Game.getGamePlayers(testGameIds[2])
    expect(game3players.map(player => player.username)).toContainEqual('test4')
  });

  test(`throws unauth when incorrect user updates 'pending' invite to 'cancelled`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");
    try{
      await Invite.update(newInvite.id, 'test4', "cancelled");
      fail()

    }catch(err){
      expect(err instanceof UnauthError).toBeTruthy()
    }
  });

  test(`updates 'pending' invite to 'accepted' with correct user`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");

    const updatedInvite = await Invite.update(newInvite.id, 'test4', "accepted");
    expect(updatedInvite.status).toEqual("accepted");
  });

  test(`throws unauth when incorrect user updates 'pending' invite to 'accepted'`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");
    try{
      await Invite.update(newInvite.id, 'test2', "accepted");
      fail()

    }catch(err){
      expect(err instanceof UnauthError).toBeTruthy()
    }
  });

  test(`updates 'pending' invite to 'denied' with correct user`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");

    const updatedInvite = await Invite.update(newInvite.id, 'test4', "denied");
    expect(updatedInvite.status).toEqual("denied");
  });

  test(`throws unauth when incorrect user updates 'pending' invite to 'denied'`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    const invite = await Invite.get(newInvite.id);
    expect(invite.status).toEqual("pending");
    try{
      await Invite.update(newInvite.id, 'test2', "denied");
      fail()

    }catch(err){
      expect(err instanceof UnauthError).toBeTruthy()
    }
  });

  test(`returns not found if inviteId does not exist`, async function () {
    try {
      await Invite.update(0, 'test1', "accepted");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns bad request if status is not an accepted value`, async function () {
    // accepted values = 'accepted', 'denied', 'cancelled'
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);

    try {
      await Invite.update(newInvite.id, 'test2', "pending");
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});

// ***************************************** delete(inviteId)

describe(`delete(inviteId)`, function () {
  test(`deletes invite with inviteId`, async function () {
    const data = {
      gameId: testGameIds[2],
      fromUser: "test2",
      toUser: "test4",
    };
    const newInvite = await Invite.create(data);
    const invite = await Invite.get(newInvite.id);
    delete invite.gameId;
    let game3invites = await Invite.getAllGameInvites(testGameIds[2]);

    expect(game3invites).toContainEqual(invite);

    await Invite.delete(invite.id);
    game3invites = await Invite.getAllGameInvites(testGameIds[2]);

    expect(game3invites).not.toContainEqual(invite);
  });

  test(`returns not found if inviteId does not exist`, async function () {
    try {
      await Invite.delete(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
