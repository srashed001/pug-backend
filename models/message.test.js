"use strict";

const db = require("../db");

const { BadRequestError, NotFoundError } = require("../expressError");

const Message = require("./message");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testThreadsIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const { testMsgIds } = require("./_testCommon");

// ************************************************ checkUsersExist(usersArray)

describe(`checkUsersExist`, function () {
  test(`returns undefined if user exist`, async function () {
    const result = await Message.checkUsersExist(["test1"]);
    expect(result).toEqual(undefined);
  });

  test(`returns undefined if all users exist`, async function () {
    const result = await Message.checkUsersExist([
      "test1",
      "test2",
      "test3",
      "test4",
    ]);
    expect(result).toEqual(undefined);
  });

  test(`returns not found when single user does not exist`, async function () {
    try {
      await Message.checkUsersExist(["test1", "test2", "test3", "bananaMan"]);
      fail();
    } catch (err) {
      expect(err.message).toEqual(`bananaMan not found`);
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns not found when multiple user does not exist`, async function () {
    try {
      await Message.checkUsersExist([
        "test1",
        "test2",
        "grapegirl",
        "bananaMan",
      ]);
      fail();
    } catch (err) {
      expect(err.message).toEqual(`grapegirl,bananaMan not found`);
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns badrequest when usersArr is not array`, async function () {
    try {
      await Message.checkUsersExist("test1");
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// ************************************************* getThreadByUsers(usersArr)

describe(`getThreadByUsers(usersArr)`, function () {
  test(`returns testThreadId[0] when usersArr contains only 
        'test1', 'test2' in any order`, async function () {
    let thread1 = await Message.getThreadByUsers(["test1", "test2"]);
    expect(thread1).toEqual({
      id: testThreadsIds[0],
    });

    thread1 = await Message.getThreadByUsers(["test2", "test1"]);
    expect(thread1).toEqual({
      id: testThreadsIds[0],
    });
  });

  test(`returns testThreadId[1] when usersArr contains only 
        'test1', 'test2', 'test3' in any order`, async function () {
    let thread2 = await Message.getThreadByUsers(["test1", "test2", "test3"]);
    expect(thread2).toEqual({
      id: testThreadsIds[1],
    });

    thread2 = await Message.getThreadByUsers(["test2", "test3", "test1"]);
    expect(thread2).toEqual({
      id: testThreadsIds[1],
    });

    thread2 = await Message.getThreadByUsers(["test3", "test1", "test2"]);
    expect(thread2).toEqual({
      id: testThreadsIds[1],
    });
  });

  test(`returns testThreadId[2] when usersArr contains only 
        'test1', 'test2', 'test3', 'test4', 'test5' in any order`, async function () {
    let thread3 = await Message.getThreadByUsers([
      "test1",
      "test2",
      "test3",
      "test4",
      "test5",
    ]);
    expect(thread3).toEqual({
      id: testThreadsIds[2],
    });

    thread3 = await Message.getThreadByUsers([
      "test2",
      "test3",
      "test4",
      "test5",
      "test1",
    ]);
    expect(thread3).toEqual({
      id: testThreadsIds[2],
    });

    thread3 = await Message.getThreadByUsers([
      "test3",
      "test4",
      "test5",
      "test1",
      "test2",
    ]);
    expect(thread3).toEqual({
      id: testThreadsIds[2],
    });

    thread3 = await Message.getThreadByUsers([
      "test4",
      "test5",
      "test1",
      "test2",
      "test3",
    ]);
    expect(thread3).toEqual({
      id: testThreadsIds[2],
    });

    thread3 = await Message.getThreadByUsers([
      "test5",
      "test1",
      "test2",
      "test3",
      "test4",
    ]);
    expect(thread3).toEqual({
      id: testThreadsIds[2],
    });
  });

  test(`returns testThreadId[3] when usersArr contains only 
          'test2', 'test3' in any order`, async function () {
    let thread4 = await Message.getThreadByUsers(["test2", "test3"]);
    expect(thread4).toEqual({
      id: testThreadsIds[3],
    });

    thread4 = await Message.getThreadByUsers(["test3", "test2"]);
    expect(thread4).toEqual({
      id: testThreadsIds[3],
    });
  });

  test(`returns testThreadId[4] when usersArr contains only 
        'test2', 'test3', 'test4' in any order`, async function () {
    let thread5 = await Message.getThreadByUsers(["test2", "test3", "test4"]);
    expect(thread5).toEqual({
      id: testThreadsIds[4],
    });

    thread5 = await Message.getThreadByUsers(["test3", "test4", "test2"]);
    expect(thread5).toEqual({
      id: testThreadsIds[4],
    });

    thread5 = await Message.getThreadByUsers(["test4", "test2", "test3"]);
    expect(thread5).toEqual({
      id: testThreadsIds[4],
    });
  });

  test("returns empty object if no thread id found", async function () {
    const thread = await Message.getThreadByUsers(["test1", "test5"]);
    expect(thread).toEqual({});
  });

  test("returns not found if user in userArray does not exist", async function () {
    try {
      await Message.getThreadByUsers(["test1", "bananaMan"]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns bad request if usersArr contains less than 2 users", async function () {
    try {
      await Message.getThreadByUsers(["test1"]);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("returns bad request if usersArr is string", async function () {
    try {
      await Message.getThreadByUsers("test1");
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("returns bad request if usersArr is number", async function () {
    try {
      await Message.getThreadByUsers(0);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("returns bad request if usersArr is object", async function () {
    try {
      await Message.getThreadByUsers({ username: "test1" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// *************************************************** getUsersThread(username)

describe(`getUsersThread(username)`, function () {
  test(`returns data on all threads user is a part of`, async function () {
    await db.query(
      `
        INSERT INTO messages (party_id, message_from, message)
        VALUES ($1, 'test1', 'delayed test message1'),  
               ($2, 'test3', 'delayed test message4'),
               ($3, 'test2', 'delayed test message5')         
    `,
      [testThreadsIds[0], testThreadsIds[3], testThreadsIds[4]]
    );
    /**
     * test1 has inactivated the last 4 messages of thread: testThreadId[2]
     * meaning those messages no longer appear in the thread ONLY for test1
     * threads for test2, test2, test4, test5 will have test4 message as last message
     * because those messages are not inactivate for them
     *
     */
    let result = await Message.getUserThreads(`test1`);
    expect(result).toEqual([
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[2],
        party: {
          test5: "http://f5.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
          test4: "http://f4.img",
          test1: "http://f1.img",
        },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[1],
        party: {
          test2: "http://f2.img",
          test3: "http://f3.img",
          test1: "http://f1.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
    ]);

    /**
     * test5 shows that his last message is from test4 because he has no deactivated any messages
     * unlike test1 who deactivated the last 4 messages
     *
     */
    result = await Message.getUserThreads("test5");
    expect(result).toEqual([
      {
        threadId: testThreadsIds[2],
        party: {
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
          test4: "http://f4.img",
          test5: "http://f5.img",
        },
        lastMessage: { test4: expect.any(String) },
      },
    ]);
  });
});

// ***************************************** createThread(usersArr)

describe("createThread", function () {
  test("creates a new thread", async function () {
    const test4ThreadsBefore = await Message.getThreadByUsers([
      "test2",
      "test4",
    ]);
    expect(test4ThreadsBefore).toEqual({});
    const result = await Message.createThread(["test2", "test4"]);
    const testThreadId = await Message.getThreadByUsers(["test2", "test4"]);
    expect(result).toEqual(testThreadId);
  });

  test("returns threadId if thread already exists with users", async function () {
    const existingThreadId = await Message.getThreadByUsers(["test1", "test2"]);
    const result = await Message.createThread(["test2", "test1"]);
    expect(result).toEqual(existingThreadId);
  });

  test("returns NotFoundError if user in usersArr not found", async function () {
    try {
      await Message.createThread(["test2", "bananaMan"]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns BadRequestError if usersArr is not array", async function () {
    try {
      await Message.createThread("test1");
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("returns BadRequestError if usersArr contains only one user", async function () {
    try {
      await Message.createThread(["test2"]);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// *********************************************** createMessage(msgFrom, msg, usersArr)

describe(`createMessage(msgFrom, msg, usersArr)`, function () {
  test(`creates a new message and thread and returns data on message`, async function () {
    const usersThreadsBefore = await Message.getThreadByUsers([
      "test2",
      "test4",
    ]);
    // returns empty object because currently no thread between test2 and test4
    expect(usersThreadsBefore).toEqual({});

    const result = await Message.createMessage(
      "test2",
      "another test message",
      ["test4", "test2"]
    );
    expect(result).toEqual({
      threadId: expect.any(String),
      id: expect.any(Number),
      messageFrom: "test2",
      message: "another test message",
      createdOn: expect.any(Date),
    });

    // checks new message, and thread are updated so they appear first in users thread
    // getUsersThreads should return most recent message and thread at the top
    const threads = await Message.getUserThreads("test2");
    expect(result.threadId).toEqual(threads[0].threadId);
    const threadsUser = Object.keys(threads[0].lastMessage);
    expect(result.messageFrom).toEqual(threadsUser[0]);
    expect(result.createdOn).toEqual(new Date(threads[0].lastMessage.test2));

    // checks that thread now exists between test2 and test4
    const usersThreadsAfter = await Message.getThreadByUsers([
      "test4",
      "test2",
    ]);
    expect(result.threadId).toEqual(usersThreadsAfter.id);
  });

  test(`retrieves existing threadId, creates new message and returns data on message`, async function () {
    const usersThreadsBefore = await Message.getThreadByUsers([
      "test2",
      "test1",
    ]);
    // returns empty object because currently no thread between test2 and test4
    expect(usersThreadsBefore.id).toEqual(testThreadsIds[0]);

    // check new message is using existing threadId
    const result = await Message.createMessage(
      "test2",
      "another test message",
      ["test1", "test2"]
    );
    expect(result).toEqual({
      threadId: testThreadsIds[0],
      id: expect.any(Number),
      messageFrom: "test2",
      message: "another test message",
      createdOn: expect.any(Date),
    });

    // checks new message, and thread are updated so they appear first in users thread
    // getUsersThreads should return most recent message and thread at the top
    const threads = await Message.getUserThreads("test1");
    expect(result.threadId).toEqual(threads[0].threadId);
    const threadsUser = Object.keys(threads[0].lastMessage);
    expect(result.messageFrom).toEqual(threadsUser[0]);
    expect(result.createdOn).toEqual(new Date(threads[0].lastMessage.test2));

    // checks that thread now exists between test2 and test4
    const usersThreadsAfter = await Message.getThreadByUsers([
      "test1",
      "test2",
    ]);
    expect(result.threadId).toEqual(usersThreadsAfter.id);
  });

  test("throws NotFound if one of users in usersArr does not exist", async function () {
    try {
      await Message.createMessage("test2", "message", ["test2", "bananaMan"]);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }

    try {
      await Message.createMessage("bananaMan", "message", [
        "test2",
        "bananaMan",
      ]);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`throws BadRequest if usersArr is not array or 
            contains less than 2 users`, async function () {
    // checks when users array is not array
    try {
      await Message.createMessage("test2", "message", ["test2"]);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
    // checks when usersArr contains less than 2 users

    try {
      await Message.createMessage("bananaMan", "message", {
        user: "test2",
        user: "bananaMan",
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test(`throws BadRequest if msgFrom is not is usersArr`, async function () {
    try {
      await Message.createMessage("test3", "test message", ["test1", "test2"]);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// *************************************************** getMsgsByThread(threadId)

describe(`getMsgsByThread(threadId, username)`, function () {
  test(`returns messages when given threadId`, async function () {
    const test1Messages = await Message.getMsgsByThread(
      testThreadsIds[2],
      "test1"
    );
    expect(test1Messages).toEqual([
      {
        id: testMsgIds[5],
        messageFrom: "test3",
        message: "test message6",
        createdOn: expect.any(Date),
      },
      {
        id: testMsgIds[6],
        messageFrom: "test1",
        message: "test message7",
        createdOn: expect.any(Date),
      },
    ]);

    const test2Messages = await Message.getMsgsByThread(
      testThreadsIds[2],
      "test2"
    );
    expect(test2Messages).toEqual([
      {
        id: testMsgIds[5],
        messageFrom: "test3",
        message: "test message6",
        createdOn: expect.any(Date),
      },
      {
        id: testMsgIds[6],
        messageFrom: "test1",
        message: "test message7",
        createdOn: expect.any(Date),
      },
      {
        id: testMsgIds[7],
        messageFrom: "test2",
        message: "test message8",
        createdOn: expect.any(Date),
      },
      {
        id: testMsgIds[8],
        messageFrom: "test1",
        message: "test message9",
        createdOn: expect.any(Date),
      },
      {
        id: testMsgIds[9],
        messageFrom: "test3",
        message: "test message10",
        createdOn: expect.any(Date),
      },
      {
        id: testMsgIds[10],
        messageFrom: "test4",
        message: "test message11",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test(`returns NotFound if threadId does not exist`, async function () {
    try {
      await Message.getMsgsByThread(`bananaThread`);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// *************************************************** checkThreadId(threadId, username)

describe(`checkThreadId(threadId, username)`, function () {
  test(`returns undefined when username exists and threadId with username exists`, async function () {
    const result = await Message.checkThreadId(testThreadsIds[1], "test3");
    expect(result).toEqual(undefined);
  });

  test(`returns notFound is username is not part of thread`, async function () {
    try {
      await Message.checkThreadId(testThreadsIds[0], "test3");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is username does not exist`, async function () {
    try {
      await Message.checkThreadId(testThreadsIds[0], "bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is threadId does not exist`, async function () {
    try {
      await Message.checkThreadId(0, "test1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// *************************************************** respondThread(threadId, username)

describe(`respondThread(threadId, username)`, function () {
  test(`creates a response in thread`, async function () {
    const result = await Message.respondThread(
      testThreadsIds[1],
      "test3",
      "new message"
    );
    expect(result).toEqual({
      threadId: testThreadsIds[1],
      id: expect.any(Number),
      messageFrom: "test3",
      message: "new message",
      createdOn: expect.any(Date),
    });
    delete result.threadId;

    const messages = await Message.getMsgsByThread(testThreadsIds[1], "test3");
    expect(messages).toContainEqual(result);
  });

  test(`returns notFound is username is not part of thread`, async function () {
    try {
      await Message.respondThread(testThreadsIds[0], "test3");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is username does not exist`, async function () {
    try {
      await Message.respondThread(testThreadsIds[0], "bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is threadId does not exist`, async function () {
    try {
      await Message.respondThread(0, "test1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// *************************************************** deleteThread(threadId, username)

describe(`deleteThread(threadId, username)`, function () {
  test(`deactivates all users messages in thread`, async function () {
    /**
     * test1 has already inactivated last 4 messages in thread
     * returns last two remaining messages in threads
     * test2 will deactivate all messages in thread returning all message_ids
     */
    let result = await Message.deleteThread(testThreadsIds[2], "test1");
    expect(result).toEqual([
      { message_id: testMsgIds[5] },
      { message_id: testMsgIds[6] },
    ]);

    let threads = await Message.getUserThreads("test1");
    expect(threads).toEqual([
      {
        threadId: testThreadsIds[1],
        party: {
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test2: expect.any(String) },
      },
    ]);

    result = await Message.deleteThread(testThreadsIds[2], "test2");
    expect(result).toEqual([
      { message_id: testMsgIds[5] },
      { message_id: testMsgIds[6] },
      { message_id: testMsgIds[7] },
      { message_id: testMsgIds[8] },
      { message_id: testMsgIds[9] },
      { message_id: testMsgIds[10] },
    ]);

    threads = await Message.getUserThreads("test2");
    expect(threads).toEqual([
      {
        threadId: testThreadsIds[4],
        party: {
          test2: "http://f2.img",
          test4: "http://f4.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
      {
        threadId: testThreadsIds[3],
        party: { test2: "http://f2.img", test3: "http://f3.img" },
        lastMessage: { test3: expect.any(String) },
      },
      {
        threadId: testThreadsIds[1],
        party: {
          test2: "http://f2.img",
          test1: "http://f1.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test2: expect.any(String) },
      },
    ]);
  });

  test(`returns notFound is username is not part of thread`, async function () {
    try {
      await Message.deleteThread(testThreadsIds[0], "test3");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is username does not exist`, async function () {
    try {
      await Message.deleteThread(testThreadsIds[0], "bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is threadId does not exist`, async function () {
    try {
      await Message.deleteThread(0, "test1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// *************************************************** deleteMsg(messageId, username)

describe(`deleteMsg(messageId, username)`, function () {
  test(`deactivates user message`, async function () {
    const result = await Message.deleteMsg(testMsgIds[5], "test1");
    expect(result).toEqual({ message_id: testMsgIds[5] });

    const thread = await Message.getMsgsByThread(testThreadsIds[2], "test1");
    expect(thread).toEqual([
      {
        id: testMsgIds[6],
        messageFrom: "test1",
        message: "test message7",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test(`returns notFound is username is not part of thread`, async function () {
    try {
      await Message.deleteMsg(testMsgIds[1], "test4");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is username does not exist`, async function () {
    try {
      await Message.deleteMsg(testMsgIds[5], "bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test(`returns notFound is threadId does not exist`, async function () {
    try {
      await Message.deleteMsg(0, "test1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
