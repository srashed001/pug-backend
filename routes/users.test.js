"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Follow = require("../models/follow");
const Message = require("../models/message");
const Invite = require("../models/invite");

const { SECRET_KEY } = require("../config");

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
  testMsgIds,
  testThreadsIds,
} = require("../routes/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const { testGameIds } = require("../routes/_testCommon");
const { createToken } = require("../helper/tokens");

// *************************************** GET /users

describe(`GET /users`, function () {
  test(`returns all users when no searchfilters provided`, async function () {
    const resp = await request(app).get("/users");
    expect(resp.body).toEqual({
      users: [
        {
          username: "test1",
          firstName: "f1",
          lastName: "l1",
          currentCity: "cc1",
          currentState: "cs1",
          profileImg: "http://f1.img",
          is_private: false,
        },
        {
          username: "test2",
          firstName: "f2",
          lastName: "l2",
          currentCity: "cc2",
          currentState: "cs2",
          profileImg: "http://f2.img",
          is_private: false,
        },
        {
          username: "test3",
          firstName: "f3",
          lastName: "l3",
          currentCity: "cc3",
          currentState: "cs3",
          profileImg: "http://f3.img",
          is_private: false,
        },
        {
          username: "test4",
          firstName: "f4",
          lastName: "l4",
          currentCity: "cc4",
          currentState: "cs4",
          profileImg: "http://f4.img",
          is_private: false,
        },
        {
          username: "test5",
          firstName: "f5",
          lastName: "l5",
          currentCity: "cc5",
          currentState: "cs5",
          profileImg: "http://f5.img",
          is_private: false,
        },
      ],
    });
  });

  test(`returns all inactive users when isActive: false`, async function () {
    const resp = await request(app).get("/users").query({ isActive: false });
    expect(resp.body).toEqual({
      users: [
        {
          username: "test3",
          firstName: "f3",
          lastName: "l3",
          currentCity: "cc3",
          currentState: "cs3",
          profileImg: "http://f3.img",
          is_private: false,
        },
      ],
    });
  });

  test(`returns users sorted by similarity to username
        when username filter passed`, async function () {
    const resp = await request(app).get("/users").query({ username: "test4" });
    expect(resp.body).toEqual({
      users: [
        {
          username: "test4",
          firstName: "f4",
          lastName: "l4",
          currentCity: "cc4",
          currentState: "cs4",
          profileImg: "http://f4.img",
          is_private: false,
        },
        {
          username: "test1",
          firstName: "f1",
          lastName: "l1",
          currentCity: "cc1",
          currentState: "cs1",
          profileImg: "http://f1.img",
          is_private: false,
        },
        {
          username: "test2",
          firstName: "f2",
          lastName: "l2",
          currentCity: "cc2",
          currentState: "cs2",
          profileImg: "http://f2.img",
          is_private: false,
        },
        {
          username: "test3",
          firstName: "f3",
          lastName: "l3",
          currentCity: "cc3",
          currentState: "cs3",
          profileImg: "http://f3.img",
          is_private: false,
        },
        {
          username: "test5",
          firstName: "f5",
          lastName: "l5",
          currentCity: "cc5",
          currentState: "cs5",
          profileImg: "http://f5.img",
          is_private: false,
        },
      ],
    });
  });

  test(`returns users with trigram similarity > .4
        when city filter passed`, async function () {
    const resp = await request(app).get("/users").query({ city: "cc4" });
    expect(resp.body).toEqual({
      users: [
        {
          username: "test4",
          firstName: "f4",
          lastName: "l4",
          currentCity: "cc4",
          currentState: "cs4",
          profileImg: "http://f4.img",
          is_private: false,
        },
      ],
    });
  });

  test(`returns users with exact match 
        when state filter passed`, async function () {
    const testuser = await User.register({
      username: "test6",
      firstName: "f6",
      lastName: "l6",
      birthDate: "1990-06-06",
      currentCity: "cc6",
      currentState: "CO",
      password: "password6",
      email: "test6@test.com",
    });
    let resp = await request(app).get("/users").query({ state: "CO" });
    expect(resp.body).toEqual({
      users: [
        {
          username: "test6",
          firstName: "f6",
          lastName: "l6",
          currentCity: "cc6",
          currentState: "CO",
          profileImg: "http://profile.img",
          is_private: false,
        },
      ],
    });

    resp = await request(app).get("/users").query({ state: "NV" });
    expect(resp.body).toEqual({ users: [] });
  });

  test(`returns badRequest if state not abbreviated correctly`, async function () {
    const resp = await request(app).get("/users").query({ state: "Colorado" });
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badRequest if provided invalid field`, async function () {
    const resp = await request(app)
      .get("/users")
      .query({ residence: "Colorado" });
    expect(resp.statusCode).toEqual(400);
  });
});

// *********************************** GET /users/:username

describe(`GET /users/:username`, function () {
  test(`returns all user data with param username`, async function () {
    const resp = await request(app).get("/users/test1");
    expect(resp.body).toEqual({
      user: {
        username: "test1",
        firstName: "f1",
        lastName: "l1",
        birthDate: "2000-01-01",
        city: "cc1",
        state: "cs1",
        profileImg: "http://f1.img",
        createdOn: expect.any(String),
        isPrivate: false,
        email: "test1@test.com",
        isAdmin: false,
        phoneNumber: null,
        followed: ["test2", "test4"],
        following: ["test2"],
      },
      games: {
        hosted: {
          pending: [
            {
              id: testGameIds[0],
              title: "g1",
              date: expect.any(String),
              time: "12:00:00",
              address: "ga1",
              city: "Fresno",
              state: "CA",
              createdBy: "test1",
              players: 2,
              daysDiff: 2,
              isActive: true,
            },
          ],
          resolved: [],
        },
        joined: {
          pending: [
            {
              id: testGameIds[1],
              title: "g2",
              date: expect.any(String),
              time: "12:00:02",
              address: "ga2",
              city: "Fresno",
              state: "CA",
              createdBy: "test2",
              players: 2,
              daysDiff: 3,
              isActive: true,
            },
          ],
          resolved: [],
        },
      },
    });
  });

  test(`returns NotFound if username does not exist`, async function () {
    const resp = await request(app).get(`/users/bananaMan`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** PATCH /users/:username

describe(`PATCH /users/:username`, function () {
  test(`updates db and returns user data with correct user token`, async function () {
    const resp = await request(app)
      .patch("/users/test1")
      .send({ firstName: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      user: {
        username: "test1",
        firstName: "bananaMan",
        lastName: "l1",
        birthDate: "2000-01-01",
        city: "cc1",
        state: "cs1",
        profileImg: "http://f1.img",
        createdOn: expect.any(String),
        isPrivate: false,
        email: "test1@test.com",
        isAdmin: false,
        phoneNumber: null,
        followed: ["test2", "test4"],
        following: ["test2"],
      },
    });

    const userResp = await request(app).get("/users/test1");
    expect(userResp.body.user).toEqual(resp.body.user);
  });

  test(`updates db and returns user data with admin token`, async function () {
    const resp = await request(app)
      .patch("/users/test1")
      .send({ firstName: "bananaMan" })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      user: {
        username: "test1",
        firstName: "bananaMan",
        lastName: "l1",
        birthDate: "2000-01-01",
        city: "cc1",
        state: "cs1",
        profileImg: "http://f1.img",
        createdOn: expect.any(String),
        isPrivate: false,
        email: "test1@test.com",
        isAdmin: false,
        phoneNumber: null,
        followed: ["test2", "test4"],
        following: ["test2"],
      },
    });

    const userResp = await request(app).get("/users/test1");
    expect(userResp.body.user).toEqual(resp.body.user);
  });

  test(`unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .patch("/users/test1")
      .send({ firstName: "bananaMan" })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns badRequest if provided invalid field`, async function () {
    const resp = await request(app)
      .patch("/users/test1")
      .send({ password: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badRequest if provided invalid data`, async function () {
    const resp = await request(app)
      .patch("/users/test1")
      .send({ username: 47 })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badRequest if updating username with existing username`, async function () {
    const resp = await request(app)
      .patch("/users/test1")
      .send({ username: "test2" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(400);
  });

  test(`returns NotFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });

    const resp = await request(app)
      .patch(`/users/bananaMan`)
      .send({ firstName: "jellygirl" })
      .set("authorization", `Bearer ${fakeToken}`);

    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** PATCH /users/:username/password

describe(`PATCH /users/:username/password`, function () {
  test(`updates users password with correct user token and valid credentials`, async function () {
    const resp = await request(app)
      .patch("/users/test1/password")
      .send({ oldPassword: "password1", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({ status: "Password updated" });

    const authResp = await request(app)
      .post("/auth/token")
      .send({ username: "test1", password: "bananaMan" });
    expect(authResp.body).toEqual({
      token: expect.any(String),
    });
  });

  test(`updates users password with admin token and valid credentials`, async function () {
    const resp = await request(app)
      .patch("/users/test1/password")
      .send({ oldPassword: "password1", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({ status: "Password updated" });

    const authResp = await request(app)
      .post("/auth/token")
      .send({ username: "test1", password: "bananaMan" });
    expect(authResp.body).toEqual({
      token: expect.any(String),
    });
  });

  test(`returns unauth with incorrect user token and valid credentials`, async function () {
    const resp = await request(app)
      .patch("/users/test1/password")
      .send({ oldPassword: "password1", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${u5Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with invalid credentials`, async function () {
    const resp = await request(app)
      .patch("/users/test1/password")
      .send({ oldPassword: "password100", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns badrequest with invalid data`, async function () {
    const resp1 = await request(app)
      .patch("/users/test1/password")
      .send({ oldPassword: 42, newPassword: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp1.statusCode).toEqual(400);

    const resp2 = await request(app)
      .patch("/users/test1/password")
      .send({ oldPassword: "password1", newPassword: 42 })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp2.statusCode).toEqual(400);
  });

  test(`returns badrequest with invalid field`, async function () {
    const resp1 = await request(app)
      .patch("/users/test1/password")
      .send({ prevPassword: "password1", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp1.statusCode).toEqual(400);
  });

  test(`returns NotFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .patch(`/users/bananaMan/password`)
      .send({ oldPassword: "password1", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns inactive if username is inactive`, async function () {
    const resp = await request(app)
      .patch(`/users/test3/password`)
      .send({ oldPassword: "password3", newPassword: "bananaMan" })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(403);
  });
});

// *********************************** PATCH /users/:username/admin

describe(`PATCH /users/:username/admin`, function () {
  test(`updates users admin status with correct user token and valid key`, async function () {
    let userResp = await request(app).get("/users/test1");
    expect(userResp.body.user.isAdmin).toBeFalsy();

    const resp = await request(app)
      .patch("/users/test1/admin")
      .send({ key: SECRET_KEY })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.user.isAdmin).toBeTruthy();
  });

  test(`updates users admin status with admin token and valid key`, async function () {
    let userResp = await request(app).get("/users/test1");
    expect(userResp.body.user.isAdmin).toBeFalsy();

    const resp = await request(app)
      .patch("/users/test1/admin")
      .send({ key: SECRET_KEY })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body.user.isAdmin).toBeTruthy();
  });

  test(`unauth with incorrect user token and valid key`, async function () {
    const resp = await request(app)
      .patch("/users/test1/admin")
      .send({ key: SECRET_KEY })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with invalid KEY`, async function () {
    const resp = await request(app)
      .patch("/users/test1/admin")
      .send({ key: "bananaMan" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns badrequest with invalid data`, async function () {
    const resp = await request(app)
      .patch("/users/test1/admin")
      .send({ key: 42 })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badrequest with invalid field`, async function () {
    const resp1 = await request(app)
      .patch("/users/test1/admin")
      .send({ secretKey: SECRET_KEY })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp1.statusCode).toEqual(400);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .patch(`/users/bananaMan/admin`)
      .send({ key: SECRET_KEY })
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** PATCH /users/:username/deactivate

describe(`PATCH /users/:username/deactivate`, function () {
  test(`deactivates user with correct user token`, async function () {
    let res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test1'`
    );
    expect(res.rows[0].is_active).toBeTruthy();

    const resp = await request(app)
      .patch("/users/test1/deactivate")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.username).toEqual("test1");
    expect(resp.body.action).toEqual("deactivated");

    res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test1'`
    );
    expect(res.rows[0].is_active).toBeFalsy();
  });

  test(`deactivates user with admin admin`, async function () {
    let res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test1'`
    );
    expect(res.rows[0].is_active).toBeTruthy();

    const resp = await request(app)
      .patch("/users/test1/deactivate")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body.username).toEqual("test1");
    expect(resp.body.action).toEqual("deactivated");

    res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test1'`
    );
    expect(res.rows[0].is_active).toBeFalsy();
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .patch("/users/test1/deactivate")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .get("/users/bananaMan/deactivate")
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** PATCH /users/:username/reactivate

describe(`PATCH /users/:username/reactivate`, function () {
  test(`deactivates user with correct user token`, async function () {
    let res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test3'`
    );
    expect(res.rows[0].is_active).toBeFalsy();

    const resp = await request(app)
      .patch("/users/test3/reactivate")
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body.username).toEqual("test3");
    expect(resp.body.action).toEqual("reactivated");

    res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test3'`
    );
    expect(res.rows[0].is_active).toBeTruthy();
  });

  test(`deactivates user with admin token`, async function () {
    let res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test3'`
    );
    expect(res.rows[0].is_active).toBeFalsy();

    const resp = await request(app)
      .patch("/users/test3/reactivate")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body.username).toEqual("test3");
    expect(resp.body.action).toEqual("reactivated");

    res = await db.query(
      `SELECT is_active FROM users WHERE username = 'test3'`
    );
    expect(res.rows[0].is_active).toBeTruthy();
  });

  test(`unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .patch("/users/test3/reactivate")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .patch("/users/bananaMan/reactivate")
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** GET /users/:username/follow

describe(`GET /users/:username/follow`, function () {
  test(`returns data on users follows and followers`, async function () {
    const resp = await request(app).get("/users/test1/follow");
    expect(resp.body).toEqual({
      followers: [
        {
          username: "test2",
          profileImg: "http://f2.img",
          city: "cc2",
          state: "cs2",
        },
        {
          username: "test4",
          profileImg: "http://f4.img",
          city: "cc4",
          state: "cs4",
        },
      ],
      follows: [
        {
          username: "test2",
          profileImg: "http://f2.img",
          city: "cc2",
          state: "cs2",
        },
      ],
    });
  });

  test(`returns notFound if username does not exist`, async function () {
    const resp = await request(app).get(`/users/bananaMan/follow`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** POST /users/:username/follow/:followed

describe(`POST /users/:username/follow/:followed`, function () {
  test(`follows user with correct user token`, async function () {
    //   test5 has no followers
    let test5Followers = await Follow.getFollowers("test5");
    expect(test5Followers).toEqual([]);

    let result = await request(app)
      .post(`/users/test1/follow/test5`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(result.body).toEqual({
      action: "followed",
      followed: "test5",
      following: "test1",
      followingProfileImg: "http://f1.img",
    });

    //   test5 has one follower: test1
    test5Followers = await Follow.getFollowers("test5");
    expect(test5Followers).toEqual([
      {
        username: "test1",
        profileImg: "http://f1.img",
        city: "cc1",
        state: "cs1",
      },
    ]);
  });

  test(`follows user with admin token`, async function () {
    //   test5 has no followers
    let test5Followers = await Follow.getFollowers("test5");
    expect(test5Followers).toEqual([]);

    let result = await request(app)
      .post(`/users/test1/follow/test5`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(result.body).toEqual({
      action: "followed",
      followed: "test5",
      following: "test1",
      followingProfileImg: "http://f1.img",
    });

    //   test5 has one follower: test1
    test5Followers = await Follow.getFollowers("test5");
    expect(test5Followers).toEqual([
      {
        username: "test1",
        profileImg: "http://f1.img",
        city: "cc1",
        state: "cs1",
      },
    ]);
  });

  test(`unauth with incorrect user token`, async function () {
    let result = await request(app)
      .post(`/users/test1/follow/test5`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(result.statusCode).toEqual(401);
  });

  test(`returns notFound if param:username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .post(`/users/bananaMan/follow/test5`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if param:followed does not exist`, async function () {
    const resp = await request(app)
      .post(`/users/test1/follow/bananaMan`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns inactive if param:username is inactive`, async function () {
    const resp = await request(app)
      .post(`/users/test3/follow/test5`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test(`returns inactive if param:followed is inactive`, async function () {
    const resp = await request(app)
      .post(`/users/test1/follow/test3`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });
});

// *********************************** GET /users/:username/threads

describe(`GET /users/:username/threads`, function () {
  test(`returns data on users threads with correct user token`, async function () {
    const resp = await request(app)
      .get("/users/test1/threads")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      threads: [
        {
          threadId: testThreadsIds[2],
          party: {
            test5: "http://f5.img",
            test1: "http://f1.img",
            test2: "http://f2.img",
            test3: "http://f3.img",
            test4: "http://f4.img",
          },
          lastMessage: { test1: expect.any(String) },
        },
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
      ],
    });
  });

  test(`returns data on users threads with admin token`, async function () {
    const resp = await request(app)
      .get("/users/test1/threads")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      threads: [
        {
          threadId: testThreadsIds[2],
          party: {
            test5: "http://f5.img",
            test1: "http://f1.img",
            test2: "http://f2.img",
            test3: "http://f3.img",
            test4: "http://f4.img",
          },
          lastMessage: { test1: expect.any(String) },
        },
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
      ],
    });
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .get("/users/test1/threads")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .get(`/users/bananaMan/threads`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** GET /users/:username/threads/:threadId

describe(`GET /users/:username/threads/:threadId`, function () {
  test(`returns data on users threads with correct user token`, async function () {
    const resp = await request(app)
      .get(`/users/test1/threads/${testThreadsIds[2]}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      messages: [
        {
          id: testMsgIds[5],
          messageFrom: "test3",
          message: "test message6",
          createdOn: expect.any(String),
        },
        {
          id: testMsgIds[6],
          messageFrom: "test1",
          message: "test message7",
          createdOn: expect.any(String),
        },
      ],
    });
  });

  test(`returns data on users threads with admin user token`, async function () {
    const resp = await request(app)
      .get(`/users/test1/threads/${testThreadsIds[2]}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      messages: [
        {
          id: testMsgIds[5],
          messageFrom: "test3",
          message: "test message6",
          createdOn: expect.any(String),
        },
        {
          id: testMsgIds[6],
          messageFrom: "test1",
          message: "test message7",
          createdOn: expect.any(String),
        },
      ],
    });
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .get(`/users/test1/threads/${testThreadsIds[2]}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .get(`/users/bananaMan/threads/${testThreadsIds[2]}`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if threadId does not exist`, async function () {
    const resp = await request(app)
      .get(`/users/test1/threads/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound user isnt in thread`, async function () {
    const resp = await request(app)
      .get(`/users/test4/threads/${testThreadsIds[0]}`)
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** POST /users/:username/threads

describe(`POST /users/:username/threads`, function () {
  test(`creates new message with correct user token`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        message: "test message",
        party: ["test1", "test2"],
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      message: {
        threadId: testThreadsIds[0],
        id: expect.any(Number),
        messageFrom: "test1",
        message: "test message",
        createdOn: expect.any(String),
      },
    });

    // new Message/thread appears at top
    const threads = await Message.getUserThreads("test1");
    expect(threads).toEqual([
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[2],
        party: {
          test5: "http://f5.img",
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
          test4: "http://f4.img",
        },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[1],
        party: {
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
    ]);
  });

  test(`creates new message with admin token`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        message: "test message",
        party: ["test1", "test2"],
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      message: {
        threadId: testThreadsIds[0],
        id: expect.any(Number),
        messageFrom: "test1",
        message: "test message",
        createdOn: expect.any(String),
      },
    });

    // new Message/thread appears at top
    const threads = await Message.getUserThreads("test1");
    expect(threads).toEqual([
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[2],
        party: {
          test5: "http://f5.img",
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
          test4: "http://f4.img",
        },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[1],
        party: {
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
    ]);
  });

  test(`return unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        message: "test message",
        party: ["test1", "test2"],
      })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .post("/users/bananaMan/threads")
      .send({
        message: "test message",
        party: ["bananaMan", "test2"],
      })
      .set("authorization", `Bearer ${fakeToken}`);

    expect(resp.statusCode).toEqual(404);
  });

  test(`returns badRequest with invalid fields`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        message: "test message",
        thread: ["bananaMan", "test2"],
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badRequest with invalid data`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        message: "test message",
        party: "bananaMan",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test(`returns badRequest with missing missing fields`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// *********************************** POST /users/:username/threads/:threadId

describe(`POST /users/:username/threads/:threadId`, function () {
  test(`creates new message in thread with correct user token`, async function () {
    const resp = await request(app)
      .post(`/users/test1/threads/${testThreadsIds[0]}`)
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      message: {
        threadId: testThreadsIds[0],
        id: expect.any(Number),
        messageFrom: "test1",
        message: "test message",
        createdOn: expect.any(String),
      },
    });

    // new Message/thread appears at top
    const threads = await Message.getUserThreads("test1");
    expect(threads).toEqual([
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[2],
        party: {
          test5: "http://f5.img",
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
          test4: "http://f4.img",
        },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[1],
        party: {
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
    ]);
  });

  test(`creates new message in thread with admin token`, async function () {
    const resp = await request(app)
      .post(`/users/test1/threads/${testThreadsIds[0]}`)
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      message: {
        threadId: testThreadsIds[0],
        id: expect.any(Number),
        messageFrom: "test1",
        message: "test message",
        createdOn: expect.any(String),
      },
    });

    // new Message/thread appears at top
    const threads = await Message.getUserThreads("test1");
    expect(threads).toEqual([
      {
        threadId: testThreadsIds[0],
        party: { test1: "http://f1.img", test2: "http://f2.img" },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[2],
        party: {
          test5: "http://f5.img",
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
          test4: "http://f4.img",
        },
        lastMessage: { test1: expect.any(String) },
      },
      {
        threadId: testThreadsIds[1],
        party: {
          test1: "http://f1.img",
          test2: "http://f2.img",
          test3: "http://f3.img",
        },
        lastMessage: { test2: expect.any(String) },
      },
    ]);
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .post(`/users/test1/threads/${testThreadsIds[0]}`)
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .post(`/users/bananaMan/threads/${testThreadsIds[0]}`)
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if threadId does not exist`, async function () {
    const resp = await request(app)
      .post(`/users/test1/threads/0}`)
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if username does not belong to thread`, async function () {
    const resp = await request(app)
      .post(`/users/test5/threads/${testThreadsIds[0]}`)
      .send({
        message: "test message",
      })
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns badRequest with invalid fields`, async function () {
    const resp = await request(app)
      .post("/users/test1/threads")
      .send({
        reply: "test message",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// *********************************** DELETE /users/:username/threads/:threadId

describe(`DELETE /users/:username/threads/:threadId`, function () {
  test(`creates new message in thread with correct user token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/threads/${testThreadsIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      messages: [{ message_id: testMsgIds[0] }, { message_id: testMsgIds[1] }],
      action: "deleted",
    });

    const messages = await Message.getMsgsByThread(testThreadsIds[0], "test1");
    expect(messages).toEqual([]);
  });

  test(`creates new message in thread with admin token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/threads/${testThreadsIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      messages: [{ message_id: testMsgIds[0] }, { message_id: testMsgIds[1] }],
      action: "deleted",
    });

    const messages = await Message.getMsgsByThread(testThreadsIds[0], "test1");
    expect(messages).toEqual([]);
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/threads/${testThreadsIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with no user token`, async function () {
    const resp = await request(app).delete(
      `/users/test1/threads/${testThreadsIds[0]}`
    );

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .delete(`/users/bananaMan/threads/${testThreadsIds[0]}`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if threadId does not exist`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/threads/0}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if username does not belong to thread`, async function () {
    const resp = await request(app)
      .delete(`/users/test5/threads/${testThreadsIds[0]}`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** DELETE /users/:username/messages/:msgId

describe(`DELETE /users/:username/messages/:msgId`, function () {
  test(`creates new message in thread with correct user token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/messages/${testMsgIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      message: { message_id: testMsgIds[0] },
      action: "deleted",
    });

    const messages = await Message.getMsgsByThread(testThreadsIds[0], "test1");
    expect(messages).toEqual([
      {
        id: testMsgIds[1],
        messageFrom: "test2",
        message: "test message2",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test(`creates new message in thread with admin token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/messages/${testMsgIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      message: { message_id: testMsgIds[0] },
      action: "deleted",
    });

    const messages = await Message.getMsgsByThread(testThreadsIds[0], "test1");
    expect(messages).toEqual([
      {
        id: testMsgIds[1],
        messageFrom: "test2",
        message: "test message2",
        createdOn: expect.any(Date),
      },
    ]);
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/messages/${testMsgIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with no user token`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/messages/${testMsgIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .delete(`/users/bananaMan/messages/${testMsgIds[0]}`)
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if msgId does not exist`, async function () {
    const resp = await request(app)
      .delete(`/users/test1/messages/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound if username does not belong to thread`, async function () {
    const resp = await request(app)
      .delete(`/users/test5/messages/${testMsgIds[0]}`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *********************************** GET /users/:username/invites

describe(`GET /users/:username/invites`, function () {
  test(`return data on users invites with correct user token`, async function () {
    await db.query(
      `
    INSERT INTO users_invites (game_id, from_user, to_user)
    VALUES ($1, 'test2', 'test1'),
           ($2, 'test5', 'test1')
`,
      [testGameIds[1], testGameIds[2]]
    );

    const resp = await request(app)
      .get("/users/test1/invites")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      invites: {
        received: [
          {
            id: expect.any(Number),
            game_id: testGameIds[1],
            fromUser: "test2",
            status: "pending",
            createdOn: expect.any(String),
          },
          {
            id: expect.any(Number),
            game_id: testGameIds[2],
            fromUser: "test5",
            status: "pending",
            createdOn: expect.any(String),
          },
        ],
        sent: [
          {
            id: expect.any(Number),
            gameId: testGameIds[0],
            toUser: "test4",
            status: "pending",
            createdOn: expect.any(String),
          },
          {
            id: expect.any(Number),
            gameId: testGameIds[0],
            toUser: "test2",
            status: "pending",
            createdOn: expect.any(String),
          },
        ],
      },
    });
  });

  test(`return data on users invites with admin token`, async function () {
    await db.query(
      `
    INSERT INTO users_invites (game_id, from_user, to_user)
    VALUES ($1, 'test2', 'test1'),
           ($2, 'test5', 'test1')
`,
      [testGameIds[1], testGameIds[2]]
    );

    const resp = await request(app)
      .get("/users/test1/invites")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      invites: {
        received: [
          {
            id: expect.any(Number),
            game_id: testGameIds[1],
            fromUser: "test2",
            status: "pending",
            createdOn: expect.any(String),
          },
          {
            id: expect.any(Number),
            game_id: testGameIds[2],
            fromUser: "test5",
            status: "pending",
            createdOn: expect.any(String),
          },
        ],
        sent: [
          {
            id: expect.any(Number),
            gameId: testGameIds[0],
            toUser: "test4",
            status: "pending",
            createdOn: expect.any(String),
          },
          {
            id: expect.any(Number),
            gameId: testGameIds[0],
            toUser: "test2",
            status: "pending",
            createdOn: expect.any(String),
          },
        ],
      },
    });
  });

  test(`return unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .get("/users/test1/invites")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`return unauth with no user token`, async function () {
    const resp = await request(app).get("/users/test1/invites");
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .get("/users/bananaMan/invites")
      .set("authorization", `Bearer ${fakeToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// *************************************** POST /users/:username/invites/:gameId

describe(`POST /users/:username/invites/:gameId`, function () {
  test(`creates a group invite with correct user token`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["test1", "test2", "test5"] })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.body).toEqual({
      invites: [
        {
          id: expect.any(Number),
          toUser: "test1",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
        {
          id: expect.any(Number),
          toUser: "test2",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
        {
          id: expect.any(Number),
          toUser: "test5",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
      ],
    });

    const game1Invites = await Invite.getGameInvites(testGameIds[1]);
    expect(resp.body.invites.map((el) => el.id)).toEqual(
      game1Invites.map((el) => el.id)
    );
  });

  test(`creates a group invite with admin token`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["test1", "test2", "test5"] })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      invites: [
        {
          id: expect.any(Number),
          toUser: "test1",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
        {
          id: expect.any(Number),
          toUser: "test2",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
        {
          id: expect.any(Number),
          toUser: "test5",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
      ],
    });

    const game1Invites = await Invite.getGameInvites(testGameIds[1]);
    expect(resp.body.invites.map((el) => el.id)).toEqual(
      game1Invites.map((el) => el.id)
    );
  });

  test(`returns unauth with incorrect user token`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["test1", "test2", "test5"] })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with no user token`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["test1", "test2", "test5"] });

    expect(resp.statusCode).toEqual(401);
  });

  test(`creates a single invite`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["test1"] })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.body).toEqual({
      invites: [
        {
          id: expect.any(Number),
          toUser: "test1",
          createdOn: expect.any(String),
          gameId: testGameIds[1],
        },
      ],
    });

    const game1Invites = await Invite.getGameInvites(testGameIds[1]);
    expect(resp.body.invites.map((el) => el.id)).toEqual(
      game1Invites.map((el) => el.id)
    );
  });

  test(`returns badRequest is toUsers is not array`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: "test1" })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(400);
  });

  test(`returns notFound :username does not exist`, async function () {
    const fakeToken = createToken({ username: "bananaMan", isAdmin: false });
    const resp = await request(app)
      .post(`/users/bananaMan/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["test1"] })
      .set("authorization", `Bearer ${fakeToken}`);

    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound :gameId does not exist`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/0`)
      .send({ toUsers: ["test1"] })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(404);
  });

  test(`returns notFound username in toUsers does not exist`, async function () {
    const resp = await request(app)
      .post(`/users/test2/invites/add/${testGameIds[1]}`)
      .send({ toUsers: ["bananaMan"] })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(404);
  });
});

// ****************************************** PATCH /users/:username/invites/cancel/:inviteId

describe(`PATCH /users/:username/invites/cancel/:inviteId`, function () {
  test(`cancels invite if invite came from :username 
          with correct user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/${fromUser}/invites/cancel/${inviteId}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      action: "cancelled",
      invite: {
        id: inviteId,
        gameId: testGameIds[0],
        fromUser,
        toUser: "test2",
        status: "cancelled",
        createdOn: expect.any(String),
      },
    });

    test2invites = await Invite.getAllInvitesReceived("test2");
    expect(test2invites[0].status).toEqual("cancelled");
  });

  test(`cancels invite if invite came from :username
          with admin token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/${fromUser}/invites/cancel/${inviteId}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      action: "cancelled",
      invite: {
        id: inviteId,
        gameId: testGameIds[0],
        fromUser,
        toUser: "test2",
        status: "cancelled",
        createdOn: expect.any(String),
      },
    });

    test2invites = await Invite.getAllInvitesReceived("test2");
    expect(test2invites[0].status).toEqual("cancelled");
  });

  test(`returns unauth with incorrect user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/${fromUser}/invites/cancel/${inviteId}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with no user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app).patch(
      `/users/${fromUser}/invites/cancel/${inviteId}`
    );

    expect(resp.statusCode).toEqual(401);
  });

  test(`throws unauth if incorrect :username trys to cancel invite`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test5/invites/cancel/${inviteId}`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if inviteId does not exist`, async function () {
    const resp = await request(app)
      .patch(`/users/test2/invites/cancel/0`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// ****************************************** PATCH /users/:username/invites/accept/:inviteId

describe(`PATCH /users/:username/invites/accept/:inviteId`, function () {
  test(`accepts invite if invite was sent to :username
          with correct user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test2/invites/accept/${inviteId}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.body).toEqual({
      action: "accepted",
      invite: {
        id: inviteId,
        gameId: testGameIds[0],
        fromUser,
        toUser: "test2",
        status: "accepted",
        createdOn: expect.any(String),
      },
    });

    test2invites = await Invite.getAllInvitesReceived("test2");
    expect(test2invites[0].status).toEqual("accepted");
  });

  test(`accepts invite if invite was sent to :username
          with admin token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test2/invites/accept/${inviteId}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      action: "accepted",
      invite: {
        id: inviteId,
        gameId: testGameIds[0],
        fromUser,
        toUser: "test2",
        status: "accepted",
        createdOn: expect.any(String),
      },
    });

    test2invites = await Invite.getAllInvitesReceived("test2");
    expect(test2invites[0].status).toEqual("accepted");
  });

  test(`returns unauth with incorrect token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test2/invites/accept/${inviteId}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with no token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app).patch(
      `/users/test2/invites/accept/${inviteId}`
    );

    expect(resp.statusCode).toEqual(401);
  });

  test(`throws unauth if incorrect :username trys to accept invite`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test5/invites/accept/${inviteId}`)
      .set("authorization", `Bearer ${u5Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if inviteId does not exist`, async function () {
    const resp = await request(app)
      .patch(`/users/test2/invites/accept/0`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

// ****************************************** PATCH /users/:username/invites/deny/:inviteId

describe(`PATCH /users/:username/invites/deny/:inviteId`, function () {
  test(`denies invite if invite was sent to :username
          with correct user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test2/invites/deny/${inviteId}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.body).toEqual({
      action: "denied",
      invite: {
        id: inviteId,
        gameId: testGameIds[0],
        fromUser,
        toUser: "test2",
        status: "denied",
        createdOn: expect.any(String),
      },
    });

    test2invites = await Invite.getAllInvitesReceived("test2");
    expect(test2invites[0].status).toEqual("denied");
  });

  test(`denies invite if invite was sent to :username
          with admin token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test2/invites/deny/${inviteId}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      action: "denied",
      invite: {
        id: inviteId,
        gameId: testGameIds[0],
        fromUser,
        toUser: "test2",
        status: "denied",
        createdOn: expect.any(String),
      },
    });

    test2invites = await Invite.getAllInvitesReceived("test2");
    expect(test2invites[0].status).toEqual("denied");
  });

  test(`returns unauth with incorrect user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test2/invites/deny/${inviteId}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns unauth with no user token`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app).patch(
      `/users/test2/invites/deny/${inviteId}`
    );

    expect(resp.statusCode).toEqual(401);
  });

  test(`throws unauth if incorrect :username trys to deny invite`, async function () {
    let test2invites = await Invite.getInvitesReceived("test2");
    const inviteId = test2invites[0].id;
    const fromUser = test2invites[0].fromUser;
    expect(test2invites).toEqual([
      {
        id: inviteId,
        game_id: testGameIds[0],
        fromUser,
        status: "pending",
        createdOn: expect.any(Date),
      },
    ]);

    const resp = await request(app)
      .patch(`/users/test5/invites/deny/${inviteId}`)
      .set("authorization", `Bearer ${u5Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`returns notFound if inviteId does not exist`, async function () {
    const resp = await request(app)
      .patch(`/users/test2/invites/deny/0`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
