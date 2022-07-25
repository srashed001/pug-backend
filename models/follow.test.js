"use strict";

const { NotFoundError, InactiveError } = require("../expressError");

const Follow = require("./follow");

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

// ************************************************* getFollowers(username)

describe(`getFollows(username)`, function () {
  test(`returns followed users with username`, async function () {
    const follows = await Follow.getFollows("test1");
    expect(follows).toEqual([
      {
        username: "test2",
        profileImg: "http://f2.img",
        firstName: 'f2',
        lastName: 'l2',
        city: "cc2",
        state: "cs2",
      },
    ]);
  });

  test(`returns empty array if no follows`, async function () {
    const follows = await Follow.getFollows("test5");
    expect(follows).toEqual([]);
  });

  test(`returns not found username does not exist`, async function () {
    try {
      await Follow.getFollows(`bananaMan`);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ************************************************* getFollowers(username)

describe(`getFollowers(username)`, function () {
  test(`returns followers with username`, async function () {
    const followers = await Follow.getFollowers("test1");
    expect(followers).toEqual([
      {
        username: "test2",
        profileImg: "http://f2.img",
        firstName: 'f2',
        lastName: 'l2',
        city: "cc2",
        state: "cs2",
      },
      {
        username: "test4",
        profileImg: "http://f4.img",
        firstName: 'f4',
        lastName: 'l4',
        city: "cc4",
        state: "cs4",
      },
    ]);
  });

  test(`returns empty array if no followers`, async function () {
    const followers = await Follow.getFollowers("test5");
    expect(followers).toEqual([]);
  });

  test(`returns not found username does not exist`, async function () {
    try {
      await Follow.getFollowers(`bananaMan`);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
// ************************************************* toggle(follower, followed)

describe(`toggle(follower, followed)`, function () {
  test(`follower unfollows user if currently following followed user`, async function () {
    // test2 follows test1 => true
    let followersBefore = await Follow.getFollowers("test1");
    expect(followersBefore).toEqual([
      {
        username: "test2",
        firstName: 'f2',
        lastName: 'l2',
        profileImg: "http://f2.img",
        city: "cc2",
        state: "cs2",
      },
      {
        username: "test4",
        firstName: 'f4',
        lastName: 'l4',
        profileImg: "http://f4.img",
        city: "cc4",
        state: "cs4",
      },
    ]);

    // because test2 follows test1, toggle should unfollow test1
    const unfollowRes = await Follow.toggle("test2", "test1");
    expect(unfollowRes).toEqual({
      action: "unfollowed",
      follower: "test2",
      followed: "test1",
      followingProfileImg: "http://f2.img",
    });

    // confirm test2 no longer follows test1
    let followersAfter = await Follow.getFollowers("test1");
    expect(followersAfter).toEqual([
      {
        firstName: 'f4',
        lastName: 'l4',
        username: "test4",
        profileImg: "http://f4.img",
        city: "cc4",
        state: "cs4",
      },
    ]);

    // checks after running toggle again, test2 follows test 1 again
    const followRes = await Follow.toggle("test2", "test1");
    expect(followRes).toEqual({
      action: "followed",
      follower: "test2",
      followed: "test1",
      followingProfileImg: "http://f2.img",
    });

    let reFollows = await Follow.getFollowers("test1");
    expect(reFollows).toEqual([
      {
        username: "test2",
        firstName: 'f2',
        lastName: 'l2',
        profileImg: "http://f2.img",
        city: "cc2",
        state: "cs2",
      },
      {
        username: "test4",
        firstName: 'f4',
        lastName: 'l4',
        profileImg: "http://f4.img",
        city: "cc4",
        state: "cs4",
      },
    ]);
  });

  test(`follower follows user if currently following followed user`, async function () {
    // test5 follows test1 => false
    let followersBefore = await Follow.getFollowers("test1");
    expect(followersBefore).toEqual([
      {
        username: "test2",
        firstName: 'f2',
        lastName: 'l2',
        profileImg: "http://f2.img",
        city: "cc2",
        state: "cs2",
      },
      {
        username: "test4",
        firstName: 'f4',
        lastName: 'l4',
        profileImg: "http://f4.img",
        city: "cc4",
        state: "cs4",
      },
    ]);

    // because test5 does not follows test1, toggle should follow test1
    const followRes = await Follow.toggle("test5", "test1");
    expect(followRes).toEqual({
      action: "followed",
      follower: "test5",
      followed: "test1",
      followingProfileImg: "http://f5.img",
    });

    // confirm test5 now follows test1
    let followersAfter = await Follow.getFollowers("test1");
    expect(followersAfter).toEqual([
      {
        username: "test2",
        firstName: 'f2',
        lastName: 'l2',
        profileImg: "http://f2.img",
        city: "cc2",
        state: "cs2",
      },
      {
        username: "test4",
        firstName: 'f4',
        lastName: 'l4',
        profileImg: "http://f4.img",
        city: "cc4",
        state: "cs4",
      },
      {
        username: "test5",
        firstName: 'f5',
        lastName: 'l5',
        profileImg: "http://f5.img",
        city: "cc5",
        state: "cs5",
      },
    ]);

    // checks after running toggle again, test5 unfollows test 1 again
    const unfollowRes = await Follow.toggle("test5", "test1");
    expect(unfollowRes).toEqual({
      action: "unfollowed",
      follower: "test5",
      followed: "test1",
      followingProfileImg: "http://f5.img",
    });

    // confirms test5 is not following test1 again
    const unFollows = await Follow.getFollowers("test1");
    expect(unFollows).toEqual([
      {
        username: "test2",
        firstName: 'f2',
        lastName: 'l2',
        profileImg: "http://f2.img",
        city: "cc2",
        state: "cs2",
      },
      {
        username: "test4",
        firstName: 'f4',
        lastName: 'l4',
        profileImg: "http://f4.img",
        city: "cc4",
        state: "cs4",
      },
    ]);
  });

  test("returns not found if follower username does not exit", async function () {
    try {
      await Follow.toggle("bananaMan", "test1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns not found if followed username does not exit", async function () {
    try {
      await Follow.toggle("test1", "bananaMan");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("returns inactive if follower is inactive", async function () {
    try {
      await Follow.toggle("test3", "test1");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });

  test("returns inactive if followed is inactive", async function () {
    try {
      await Follow.toggle("test1", "test3");
      fail();
    } catch (err) {
      expect(err instanceof InactiveError).toBeTruthy();
    }
  });
});
