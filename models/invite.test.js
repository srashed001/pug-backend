"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  InactiveError,
} = require("../expressError");
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
    const getInvite = await Invite.get(newInvite.id)
    expect(getInvite).toEqual({
      id: expect.any(Number),
      gameId: testGameIds[0],
      fromUser: 'test1',
      toUser: 'test5',
      status: 'pending',
      createdOn: expect.any(Date)
    })
  });

  test("returns not found if inviteId does not exist", async function () {
    try{
      await Invite.get(0);
      fail()
    }catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  });
});

// **************************************** getAllGameInvites(gameId)
describe('getAllGameInvites(gameId)', function(){
  test(`returns all invites to game, including inactive user invites`, async function(){
    // test3 is inactive but invite still appears
    const invites = await Invite.getAllGameInvites(testGameIds[0]);
    expect(invites).toEqual([
      {
        id: expect.any(Number),
        fromUser: 'test1',
        toUser: "test4",
        status: 'pending',
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        fromUser: 'test1',
        toUser: "test3",
        status: 'pending',
        createdOn: expect.any(Date),
      },
      {
        id: expect.any(Number),
        fromUser: 'test1',
        toUser: "test2",
        status: 'pending',
        createdOn: expect.any(Date),
      },
    ])
  })

  test(`returns not found if gameId does not exist`, async function(){
    try{
      await Invite.getAllGameInvites(0)
      fail()
    }catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })

  test(`returns inactive if game is inactive`, async function(){
    try{
      await Invite.getAllGameInvites(testGameIds[3])
      fail()
    }catch(err){
      expect(err instanceof InactiveError).toBeTruthy()
    }
  })
})

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
        game_id: testGameIds[0],
        fromUser: "test1",
        status: "pending",
        createdOn: expect.any(Date),
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



// ****************************************** update(userInviteId, status)
describe(`update(userInviteId, status)`, function(){
  test(`updates userInvite status with status`, async function(){
    const data = {
      gameId: testGameIds[2],
      fromUser: 'test2',
      toUser: 'test4'
    }
    const newInvite = await Invite.create(data)
    
    const invite = await Invite.get(newInvite.id)
    expect(invite.status).toEqual('pending')

    const updatedInvite = await Invite.update(newInvite.id, 'accepted')
    expect(updatedInvite.status).toEqual('accepted')
  });

  test(`returns not found if inviteId does not exist`, async function(){
    try{
      await Invite.update(0, 'accepted')
      fail(); 
    }catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })

  test(`returns bad request if status is not an accepted value`, async function(){
    // accepted values = 'accepted', 'denied', 'cancelled', 'pending'
    const data = {
      gameId: testGameIds[2],
      fromUser: 'test2',
      toUser: 'test4'
    }
    const newInvite = await Invite.create(data)

    try{
      await Invite.update(newInvite.id, 'not sure')
      fail(); 
    }catch(err){
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  })

  test(`returns bad request if updating with same status`, async function(){
    // accepted values = 'accepted', 'denied', 'cancelled', 'pending'
    const data = {
      gameId: testGameIds[2],
      fromUser: 'test2',
      toUser: 'test4'
    }
    const newInvite = await Invite.create(data)
    const invite = await Invite.get(newInvite.id)

    try{
      await Invite.update(newInvite.id, invite.status)
      fail(); 
    }catch(err){
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  })
})

// ***************************************** delete(inviteId)
describe(`delete(inviteId)`, function(){
  test(`deletes invite with inviteId`, async function(){
    const data = {
      gameId: testGameIds[2],
      fromUser: 'test2',
      toUser: 'test4'
    }
    const newInvite = await Invite.create(data)
    const invite = await Invite.get(newInvite.id)
    delete invite.gameId
    let game3invites = await Invite.getAllGameInvites(testGameIds[2])

    expect(game3invites).toContainEqual(invite)

    await Invite.delete(invite.id)
    game3invites = await Invite.getAllGameInvites(testGameIds[2])

    expect(game3invites).not.toContainEqual(invite)
  })

  test(`returns not found if inviteId does not exist`, async function(){
    try{
      await Invite.delete(0);
      fail()
    }catch(err){
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })
})
