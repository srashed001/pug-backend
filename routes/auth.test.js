"use strict";

const request = require("supertest");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("../models/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// *************************************** POST /auth/token

describe("POST /auth/token", function () {
  test("returns token with valid credentials", async function () {
    const resp = await request(app).post("/auth/token").send({
      username: "test1",
      password: "password1",
    });
    expect(resp.body).toEqual({
      token: expect.any(String),
    });
  });

  test("returns unath with username that does not exist", async function () {
    const resp = await request(app).post("/auth/token").send({
      username: "bananaMan",
      password: "password1",
    });

    expect(resp.statusCode).toEqual(401);
    expect(resp.body.error.message).toEqual("Invalid username/password");
  });

  test("returns unath with wrong password", async function () {
    const resp = await request(app).post("/auth/token").send({
      username: "test1",
      password: "password",
    });

    expect(resp.statusCode).toEqual(401);
    expect(resp.body.error.message).toEqual("Invalid username/password");
  });

  test("returns badrequest with missing data", async function () {
    const resp = await request(app).post("/auth/token").send({
      username: "test1",
    });

    expect(resp.statusCode).toEqual(400);
  });

  test("returns badrequest with invalid data", async function () {
    const resp = await request(app).post("/auth/token").send({
      username: 42,
      password: "password1",
    });

    expect(resp.statusCode).toEqual(400);
  });

  test("returns badrequest with invalid fields", async function () {
    const resp = await request(app).post("/auth/token").send({
      user: "test1",
      password: "password1",
    });

    expect(resp.statusCode).toEqual(400);
  });
});

// ************************************************* POST /auth/register

describe("POST /auth/register", function () {
  test("returns token with valid data", async function () {
    const resp = await request(app).post("/auth/register").send({
      username: "test6",
      firstName: "f6",
      lastName: "l6",
      birthDate: "1990-06-06",
      currentCity: "cc6",
      currentState: "CA",
      password: "password6",
      email: "test6@test.com",
    });

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      token: expect.any(String),
    });
  });

  test("returns badrequest with missing required fields", async function () {
    const resp = await request(app)
      .post("/auth/register")
      .send({ username: "test7" });
    expect(resp.statusCode).toEqual(400);
  });

  test(`badrequest with invalid data, 
          (not using 2 letter abbreviation for state)`, async function () {
    const resp = await request(app).post("/auth/register").send({
      username: "test6",
      firstName: "f6",
      lastName: "l6",
      birthDate: "1990-06-06",
      currentCity: "cc6",
      currentState: "California",
      password: "password6",
      email: "test6@test.com",
    });

    expect(resp.statusCode).toEqual(400);
  });

  test(`badrequest with invalid data, 
          (invalid email format)`, async function () {
    const resp = await request(app).post("/auth/register").send({
      username: "test6",
      firstName: "f6",
      lastName: "l6",
      birthDate: "1990-06-06",
      currentCity: "cc6",
      currentState: "CA",
      password: "password6",
      email: "test.com",
    });

    expect(resp.statusCode).toEqual(400);
  });

  test(`badrequest if selecting existing username`, async function () {
    const resp = await request(app).post("/auth/register").send({
      username: "test1",
      firstName: "f6",
      lastName: "l6",
      birthDate: "1990-06-06",
      currentCity: "cc6",
      currentState: "CA",
      password: "password6",
      email: "test.com",
    });

    expect(resp.statusCode).toEqual(400);
  });
});
