"use strict";

const jwt = require("jsonwebtoken");
const { UnauthError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
  ensureHostOrAdmin,
  ensureAuthDeleteComment,
} = require("./auth");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("../routes/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const { testGameIds, testCommentIds } = require("../routes/_testCommon");

const { SECRET_KEY } = require("../config");

const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

// ************************************* authenticateJWT
describe(`authenticateJWT`, function () {
  test(`stores user info in res.locals with valid token`, function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };

    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test(`no user info stored in res.local with invalid token`, function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };

    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test(`no user info stored in res.local without token`, function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };

    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});

// *************************************** ensureLoggedIn
describe(`ensureLoggedIn`, function () {
  test(`no error when logged in`, function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test(`unauth when not logged in`, function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

// *************************************** ensureCorrectUserOrAdmin
describe(`ensureCorrectUserOrAdmin`, function () {
  test(`no error when user is admin`, function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "admin", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test(`no error when req.params.username === res.locals.user.username`, function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test(`uathError when user is not admind and 
        req.params.username !== res.locals.user.username`, function () {
    expect.assertions(1);
    const req = { params: { username: "bananaMan" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test(`uathError user not logged in`, function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });
});

// *************************************** ensureHostOrAdmin
describe(`ensureHostOrAdmin`, function () {
  test(`no error when user is game host`, function () {
    expect.assertions(1);
    const req = { params: { gameId: testGameIds[0] } };
    const res = { locals: { user: { username: "test1", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureHostOrAdmin(req, res, next);
  });

  test(`no error when user is admin`, function () {
    expect.assertions(1);
    const req = { params: { gameId: testGameIds[0] } };
    const res = { locals: { user: { username: "admin", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureHostOrAdmin(req, res, next);
  });

  test(`unauthError when user is not game host`, function () {
    expect.assertions(1);
    const req = { params: { gameId: testGameIds[0] } };
    const res = { locals: { user: { username: "bananaMan", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureHostOrAdmin(req, res, next);
  });

  test(`uathError user not logged in`, function () {
    expect.assertions(1);
    const req = { params: { gameId: testGameIds[0] } };
    const res = { locals: { user: {} } };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureHostOrAdmin(req, res, next);
  });
});

// *************************************** ensureAuthDeleteComment
describe(`ensureAuthDeleteComment`, function () {
  test(`no error when user is game host`, function () {
    const req = {
      params: { gameId: testGameIds[0], commentId: testCommentIds[2] },
    };
    const res = { locals: { user: { username: "test1", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAuthDeleteComment(req, res, next);
  });

  test(`no error when user is admin`, function () {
    const req = { params: { gameId: testGameIds[0], commentId: testCommentIds[2] } };
    const res = { locals: { user: { username: "admin", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAuthDeleteComment(req, res, next);
  });

  test(`no error when user created comment`, function () {
    const req = { params: { gameId: testGameIds[0], commentId: testCommentIds[2] } };
    const res = { locals: { user: { username: "test4", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAuthDeleteComment(req, res, next);
  });

  test(`unauthError when not correct user`, function () {
    expect.assertions(1);
    const req = { params: { gameId: testGameIds[0], commentId: testCommentIds[2] } };
    const res = { locals: { user: { username: "test5", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureHostOrAdmin(req, res, next);
  });

  test(`unauthError when not correct user`, function () {
    expect.assertions(1);
    const req = { params: { gameId: testGameIds[0], commentId: testCommentIds[2] } };
    const res = { locals: { } };
    const next = function (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    };
    ensureHostOrAdmin(req, res, next);
  });
});
