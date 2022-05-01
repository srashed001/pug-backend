"use strict";

const { SECRET_KEY } = require("../config");
const db = require("../db");
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

/**
 * users 'test1' & 'test2' are active users
 * user 'test3' is inactive user
 *
 */

// ******************************************* get(username)

describe("get(username)", function () {
  test("return a single user", async function () {
    /*
    test3 is inactive user 
    test1 is following test3
    test3 does not appear in isFollowing Array because user is inactive
    */

    let user = await User.get("test1");
    expect(user).toEqual({
      username: "test1",
      firstName: "f1",
      lastName: "l1",
      birthDate: "2000-01-01",
      city: "cc1",
      state: "cs1",
      profileImg: "http://f1.img",
      createdOn: expect.any(Date),
      isPrivate: false,
      email: "test1@test.com",
      isAdmin: false, 
      phoneNumber: null,
      following: ["test2"],
      followed: ["test2", "test4"],
    });
  });

  test("not found if user profile is not active", async function () {
    try {
      await User.get("test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ****************************************** findAll()

describe("findAll()", function () {
  test("return a list of all users", async function () {
    let users = await User.findAll();
    expect(users).toEqual([
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
    ]);
  });

  test("return a list of all active users", async function () {
    let users = await User.findAll({isActive: true});
    expect(users).toEqual([
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
    ]);
  });

  test("return a list of all inactive users", async function () {
    let users = await User.findAll({isActive: false});
    expect(users).toEqual([
      {
        username: "test3",
        firstName: "f3",
        lastName: "l3",
        currentCity: "cc3",
        currentState: "cs3",
        profileImg: "http://f3.img",
        is_private: false,
      },
    ]);
  });

  test("return list of users ordered by similarity when lastName filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test7@test.com', true)`);

    let users = await User.findAll({ lastName: "l4" });
    expect(users).toEqual([
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
        username: "test47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
        is_private: false,
      },
      {
        username: "tes47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
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
        username: "test1",
        firstName: "f1",
        lastName: "l1",
        currentCity: "cc1",
        currentState: "cs1",
        profileImg: "http://f1.img",
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
    ]);
  });

  test("return list of users ordered by similarity when firstName filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test7@test.com', true)`);

    let users = await User.findAll({ firstName: "f4" });
    expect(users).toEqual([
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
        username: "test47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
        is_private: false,
      },
      {
        username: "tes47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
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
        username: "test1",
        firstName: "f1",
        lastName: "l1",
        currentCity: "cc1",
        currentState: "cs1",
        profileImg: "http://f1.img",
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
    ]);
  });

  test("return list of users ordered by similarity when username filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test7@test.com', true)`);

    let users = await User.findAll({ username: "test4" });
    expect(users).toEqual([
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
        username: "test47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
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
        username: "test1",
        firstName: "f1",
        lastName: "l1",
        currentCity: "cc1",
        currentState: "cs1",
        profileImg: "http://f1.img",
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
      {
        username: "tes47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
        is_private: false,
      },
    ]);
  });

  test("return list of ACTIVE users ordered by similarity when isActive = true and username filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test7@test.com', true)`);
    
    // test3 will not appear in list

    let users = await User.findAll({ username: "test4", isActive: true });
    expect(users).toEqual([
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
        username: "test47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
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
        username: "test5",
        firstName: "f5",
        lastName: "l5",
        currentCity: "cc5",
        currentState: "cs5",
        profileImg: "http://f5.img",
        is_private: false,
      },
      {
        username: "tes47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
        is_private: false,
      },
    ]);
  });

  test("return list of INACTIVE users ordered by similarity when isActive = false and username filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test7@test.com', true)`);
    
    // test3 will not appear in list

    let users = await User.findAll({ username: "test4", isActive: false });
    expect(users).toEqual([
      {
        username: "test3",
        firstName: "f3",
        lastName: "l3",
        currentCity: "cc3",
        currentState: "cs3",
        profileImg: "http://f3.img",
        is_private: false,
      },
    ]);
  });

  test("return list of users with similar current_city when city filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'cs47', 'http://f47.img', 'PASS', 'test7@test.com', true)`);

    let users = await User.findAll({ city: "cc47" });
    expect(users).toEqual([
   
      {
        username: "test47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
        is_private: false,
      },
      {
        username: "tes47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "cs47",
        profileImg: "http://f47.img",
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
    ]);
  });

  test("return list of users where state matches exactly when state filter passed", async function () {
    await db.query(`INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
                    VALUES  ('test47', 'f47', 'l47', '2000-01-01', 'cc47', 'CA', 'http://f47.img', 'PASS', 'test47@test.com', true),
                            ('tes47', 'f47', 'l47', '2000-01-01', 'cc47', 'CA', 'http://f47.img', 'PASS', 'test7@test.com', true)`);

    let users = await User.findAll({ state: "CA" });
    expect(users).toEqual([
   
      {
        username: "test47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "CA",
        profileImg: "http://f47.img",
        is_private: false,
      },
      {
        username: "tes47",
        firstName: "f47",
        lastName: "l47",
        currentCity: "cc47",
        currentState: "CA",
        profileImg: "http://f47.img",
        is_private: false,
      },   
    ]);
  });
});

// ****************************************** authenticate(username, password)

describe("authenticate(username,password)", function () {
  test("returns curr_user details if user is active and credentials are valid", async function () {
    let user = await User.authenticate("test1", "password1");
    expect(user).toEqual({
      username: "test1",
      isAdmin: false
    });
  });

  test("unauth if credentials invalid", async function () {
    try {
      await User.authenticate("test1", "banana");
      fail();
    } catch (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    }
  });

  test("unauth if user not found", async function () {
    try {
      await User.authenticate("banana", "password1");
      fail();
    } catch (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    }
  });

  test("inactive if user not active", async function () {
    try {
      await User.authenticate("test3", "password3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});

// ************************************************ register(data)

describe("register(data)", function () {
  test("returns user data with valid username", async function () {
    const data = {
      username: "test6",
      firstName: "f6",
      lastName: "l6",
      birthDate: "2000-01-06",
      currentCity: "cc6",
      currentState: "cs6",
      phoneNumber: null,
      password: "password6",
      email: "test6",
    };
    const user = await User.register(data);

    expect(user).toEqual({
      username: 'test6',
      isAdmin: false
    });

    const users = await User.findAll();
    const usernames = users.map((u) => u.username);
    expect(usernames).toContain(user.username);
  });

  test("bad request if dupicate username", async function () {
    const badData = {
      username: "test1",
      firstName: "f4",
      lastName: "l4",
      birthDate: "2000-01-04",
      currentCity: "cc4",
      currentState: "cs4",
      phoneNumber: null,
      profileImg: "http://f4.img",
      password: "password4",
      email: "test4",
    };

    try {
      await User.register(badData);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// ******************************************** update(username, data)

describe("update(username, data)", function () {
  test("updates username if not taken", async function () {
    const user = await User.update("test3", { username: "bananaMan" });

    expect(user).toEqual({
      username: "bananaMan",
      firstName: "f3",
      lastName: "l3",
      birthDate: "2000-01-03",
      city: "cc3",
      state: "cs3",
      phoneNumber: null,
      profileImg: "http://f3.img",
      email: "test3@test.com",
      isPrivate: false,
      isAdmin: false,
      following: [],
      followed: [],
      createdOn: expect.any(Date),
    });
  });

  test("bad request if attempting to update username that already exist", async function () {
    try {
      await User.update("test1", { username: "test2" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("updates partial data", async function () {
    const test = await User.get("test2");
    delete test.createdOn;
    const data = {
      firstName: "banana",
      lastName: "man",
    };

    const user = await User.update("test2", data);
    expect(user).toEqual({
      ...test,
      ...data,
      email: "test2@test.com",
      phoneNumber: null,
      isAdmin: false,
      createdOn: expect.any(Date),
    });
  });

  test("bad request if attempting to change password", async function () {
    try {
      await User.update("test1", { password: "password123" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request if attempting to change is_admin status", async function () {
    try {
      await User.update("test1", { is_admin: true });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request if data includes invalid fields", async function () {
    try {
      await User.update("test1", { favorite_color: "purple" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// ******************************************** reactivate(username)

describe("reactivate(user)", function () {
  test("reactivates existing user", async function () {
    let users = await User.findAll({isActive: true});
    let usernames = users.map((u) => u.username);
    expect(usernames).not.toContain("test3");

    await User.reactivate("test3");
    users = await User.findAll({isActive: true});
    usernames = users.map((u) => u.username);
    expect(usernames).toContain("test3");
  });

  test("not found if no such user", async function () {
    try {
      await User.reactivate("bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ******************************************** deactivate(username)

describe("deactivate(user)", function () {
  test("deactivates existing user", async function () {
    let users = await User.findAll({isActive: true});
    let usernames = users.map((u) => u.username);
    expect(usernames).toContain("test1");

    await User.deactivate("test1");
    users = await User.findAll({isActive: true});
    usernames = users.map((u) => u.username);
    expect(usernames).not.toContain("test1");
  });

  test("not found if no such user", async function () {
    try {
      await User.deactivate("bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ***************************************** updatePassword(username, oldPassword, newPassword)

describe("updatePassword(username, oldPassword, newPassword)", function () {
  test("updates password with valid credentials", async function () {
    const oldPasswordRes = await User.authenticate("test1", "password1");
    await User.updatePassword("test1", "password1", "password2");

    const newPasswordRes = await User.authenticate("test1", "password2");
    expect(oldPasswordRes).toEqual(newPasswordRes);
  });

  test("not found if no such user", async function () {
    try {
      await User.updatePassword("bananaMan", "password1", "password2");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("unath if invalid credentials provided", async function () {
    try {
      await User.updatePassword("test1", "bananaMan", "password2");
      fail();
    } catch (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    }
  });
});

// ***************************************** updateIsAdmin(username, key)

describe("updateIsAdmin", function () {
  test("updates isAdmin status with secret key", async function () {
    const oldUser = await User.authenticate("test1", "password1");
    const oldAdminStatus = oldUser.isAdmin;
    const newUser = await User.updateIsAdmin("test1", SECRET_KEY);
    const newAdminStatus = newUser.isAdmin;

    expect(oldAdminStatus).toEqual(!newAdminStatus);
  });

  test("not found if no such user", async function () {
    try {
      await User.updateIsAdmin("bananaMan", SECRET_KEY);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("unath if invalid key provided", async function () {
    try {
      await User.updateIsAdmin("test1", "bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof UnauthError).toBeTruthy();
    }
  });
});
