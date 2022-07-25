"use strict";

const request = require("supertest");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
} = require("../routes/_testCommon");


beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


// *************************************** GET /games

describe(`GET /activities/:username`, function () {
  test(`returns with valid token following and personal activity`, async function () {
    const resp = await request(app)
      .get("/activity/test2")
      .set("authorization", `Bearer ${u2Token}`);
    expect(
      resp.body.activity.find((activity) => activity.primaryuser !== "test1")
    ).toBeFalsy();
    expect(
      resp.body.myActivity.find((activity) => activity.primaryuser !== "test2")
    ).toBeFalsy();
  });

  test(`returns with admin token following and personal activity`, async function () {
    const resp = await request(app)
      .get("/activity/test2")
      .set("authorization", `Bearer ${adminToken}`);
    expect(
      resp.body.activity.find((activity) => activity.primaryuser !== "test1")
    ).toBeFalsy();
    expect(
      resp.body.myActivity.find((activity) => activity.primaryuser !== "test2")
    ).toBeFalsy();
  });

  test(`unauth with incorrect user token`, async function () {
    const resp = await request(app)
    .get("/activity/test2")
    .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test(`badrequest with ivalid user`, async function () {
    const resp = await request(app)
    .get("/activity/bananaMan")
    .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(404);
  });
});

