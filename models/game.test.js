"use strict";

const {
  BadRequestError,
  NotFoundError,
  InactiveError,
  UnauthError,
} = require("../expressError");
const User = require("./user");

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

const {testGameIds} = require("./_testCommon")


// ************************************************* get(gameId)

describe('get(gameId)', function(){
    test('returns a single game', async function(){
        console.log(testGameIds)
    })
})