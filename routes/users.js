"use strict";

const jsonschema = require("jsonschema");
const usersSearchSchema = require("../schemas/userSearch.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const userUpdatePasswordSchema = require("../schemas/userUpdatePassword.json");
const userUpdateAdminSchema = require("../schemas/userUpdateAdmin.json");
const newMessageSchema = require("../schemas/newMessage.json");
const newInviteSchema = require("../schemas/newInvite.json");
const threadResponseSchema = require("../schemas/threadResponse.json");
const newThreadSchema = require("../schemas/newThread.json");
const express = require("express");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const Game = require("../models/game");
const Follow = require("../models/follow");
const Invite = require("../models/invite");
const Message = require("../models/message");
const {
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");

const router = express.Router();

/** GET / => { users: [{username, firstName, lastName, city, state, profileImg, isPrivate }]}
 *
 * Can provide search filters in query:
 *
 * - username => returns list ordered by username
 * - firstName => returns list ordered by similarity
 * - lastName => returns list ordered by lastName
 * - city => returns list where trigram similarity is > .4
 * - state => returns list where state is exact match
 * - isActive => undefined/null => returns all users
 *               true => returns active users
 *               false => returns inactive users
 *
 * Authorization required: none
 *
 */
router.get("/", async function (req, res, next) {
  const q = req.query;
  if (q.isActive === "true" || q.isActive === "false")
    q.isActive = JSON.parse(q.isActive);

  try {
    const validator = jsonschema.validate(q, usersSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const users = await User.findAll(q);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

router.get("/:username/check", async function (req, res, next) {

  try {
    const status = await User.checkUsername(req.params.username);
    return res.json({ username: req.params.username, status });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => {user}
 *
 * Returns {user, games}
 *  where user is {username, firstName, lastName, city, state, profileImg, createdOn, isPrivate, email, isAdmin, phoneNumber, following, followed}
 *  where game is {hosted: {pending, resolved}, joined: {pending, resolved}}
 *  - where hosted are games username hosted
 *         - pending => games whose date has not passed {id, title, date, time, address, city, state, createdBy, players, daysDiff, isActive}
 *         - resolved => games whose date has passed {id, title, date, time, address, city, state, createdBy, players, daysDiff, isActive}
 *  - where joined are games username joined
 *         - pending => games whose date has not passed {id, title, date, time, address, city, state, createdBy, players, daysDiff, isActive}
 *         - resolved => games whose date has passed {id, title, date, time, address, city, state, createdBy, players, daysDiff, isActive}
 *
 * Authorization required: none
 */
router.get("/:username", async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    const hostedResolved = await Game.findAll({
      host: req.params.username,
      gameStatus: "resolved",
      isActive: true,
    });
    const joinedResolved = await Game.findAll({
      joined: req.params.username,
      gameStatus: "resolved",
      isActive: true,
    });
    const hostedPending = await Game.findAll({
      host: req.params.username,
      gameStatus: "pending",
      isActive: true,
    });
    const joinedPending = await Game.findAll({
      joined: req.params.username,
      gameStatus: "pending",
      isActive: true,
    });
    const follows = await Follow.getFollows(req.params.username)
    const followers = await Follow.getFollowers(req.params.username)
    return res.json({
      ...user,
      games: {
        hosted: {
          pending: hostedPending,
          resolved: hostedResolved,
        },
        joined: {
          pending: joinedPending,
          resolved: joinedResolved,
        },
      },
      followers, 
      follows, 
    });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[username] {user} => {user}
 * Data can include:
 *  { username, firstName, lastName, birthDate, city, phoneNumber, profileImg, email, isPrivate }
 *
 * Returns {username, firstName, lastName, city, state, profileImg, createOn, isPrivate, email, isAdmin, phoneNumber, following, followed}
 *
 * Authorization required: admin or same-user-as-:username
 */

router.patch(
  `/:username`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/password {oldPassword, newPassword} => {status: 'Password updated'}
 * Data includes:
 *  - oldPassword
 *  - newPassword
 *
 * Returns {status}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.patch(
  `/:username/password`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdatePasswordSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const { oldPassword, newPassword } = req.body;
      await User.updatePassword(req.params.username, oldPassword, newPassword);
      return res.json({ status: "Password updated" });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/admin {key} => {user}
 * Data includes:
 *  - key - SECRET_KEY needed to update is Admin Status
 *
 * Returns {username, firstName, lastName, city, state, profileImg, createOn, isPrivate, email, isAdmin, phoneNumber, following, followed}
 *
 * Authorization required: admin or same-user-as-:username
 */

router.patch(
  `/:username/admin`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateAdminSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const { key } = req.body;
      const user = await User.updateIsAdmin(req.params.username, key);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/deactivate
 *
 * Returns {username, action: 'deactivated"}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.patch(
  `/:username/deactivate`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      await User.deactivate(req.params.username);
      return res.json({
        username: req.params.username,
        action: "deactivated",
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/reactivate
 *
 * Returns {username, action: 'reactivated"}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.patch(
  `/:username/reactivate`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      await User.reactivate(req.params.username);
      return res.json({
        username: req.params.username,
        action: "reactivated",
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /[username]/follow
 *
 * Returns {followers, follows}
 *  where followers/follows {username, profileImg, city, state}
 *
 * Authorization required: none
 */
router.get(`/:username/follow`, async function (req, res, next) {
  try {
    const followers = await Follow.getFollowers(req.params.username);
    const follows = await Follow.getFollows(req.params.username);
    return res.json({ followers, follows });
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/follow/[followed]
 *
 * Returns {action, followed, following, followingProfileImg}
 *  where action is "followed"/"unfollowed"
 *
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post(
  `/:username/follow/:followed`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const result = await Follow.toggle(
        req.params.username,
        req.params.followed
      );
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /[username]/threads
 *
 * Returns {threads: [ { threadId, party, lastMessage }, ...] }
 *  where party is {username: profileImg}
 *  where lastMessage is {username: createdOn}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.get(
  `/:username/threads`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const threads = await Message.getUserThreads(req.params.username);
      return res.json({ threads });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /[username]/threads/[threadId]
 *
 * Returns {messages: [ { id, messageFrom, message, createdOn }, ...]}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.get(
  `/:username/threads/:threadId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const thread = await Message.getMsgsByThread(
        req.params.threadId,
        req.params.username
      );
      return res.json({ thread });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[username]/[threadId]
 * 
 * Returns {id: threadId}
 * 
 * Authorization required: admin or same-user-as-:usernamejest 
 */
router.post(
  `/:username/threadId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, newThreadSchema)
      if(!validator.valid){
        const errs = validator.errors.map(e => e.stack)
        throw new BadRequestError(errs)
      }
      const id = await Message.createThread(req.body.party)
      return res.json(id);
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[username]/threads
 *  Data include:
 *  - message
 *  - party => users in thread
 *
 * Returns {message: {threadId, id, messageFrom, message, createdOn}}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post(
  `/:username/threads`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, newMessageSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const message = await Message.createMessage(
        req.params.username,
        req.body.message,
        req.body.party
      );
      return res.json({ message });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[username]/threads/[threadId]
 *  Data include:
 *  - message
 *
 * Meant to be used when threadId is made available
 *
 * Returns {message: {threadId, id, messageFrom, message, createdOn}}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post(
  `/:username/threads/:threadId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, threadResponseSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const message = await Message.respondThread(
        req.params.threadId,
        req.params.username,
        req.body.message
      );
      return res.json({ message });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]/threads/[threadId]
 *
 * inactivates all messages for a user in a thread
 *
 * Returns { messages: [ { messageId }, ... ], action: "deleted" }
 *
 * Authorization required: admin or same-user-as-:username
 */
router.delete(
  `/:username/threads/:threadId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const messages = await Message.deleteThread(
        req.params.threadId,
        req.params.username
      );
      return res.json({ messages, action: "deleted" });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]/messages/[msgId]
 *
 * inactivates message for a user in a thread
 *
 * Returns { message: { messageId }, action: "deleted" }
 *
 * Authorization required: admin or same-user-as-:username
 */
router.delete(
  `/:username/messages/:msgId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const message = await Message.deleteMsg(
        req.params.msgId,
        req.params.username
      );
      return res.json({ message, action: "deleted" });
    } catch (err) {
      return next(err);
    }
  }
);
/***
 * 
 * 
 * change (id, gameId, fromUser, toUser, status, createdOn )
 * 
 * 
 * 
 * 
 * 
 */
/** GET /[username]/invites
 *
 * Returns {invites: received: [Array], sent: [Array]}
 *  where received is [{id, gameId, fromUser, status, createdOn}, ...]
 *  where sent is [{id, gameId, toUser, status, createdOn}, ...]
 *
 * Authorization required: admin or same-user-as-:username
 */
router.get(
  `/:username/invites`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const received = await Invite.getInvitesReceived(req.params.username);
      const sent = await Invite.getInvitesSent(req.params.username);
      return res.json({
        invites: {
          received,
          sent,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /[username]/invites/add/[gameId]
 *
 * Returns {invites: [{id, gameId, toUser, status, createdOn}, ...]}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post(
  `/:username/invites/add/:gameId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, newInviteSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      if (req.body.toUsers.length > 1) {
        const invites = await Invite.createGroup({
          gameId: req.params.gameId,
          fromUser: req.params.username,
          usersArr: req.body.toUsers,
        });
        return res.json({ invites });
      }

      const invites = await Invite.create({
        gameId: req.params.gameId,
        fromUser: req.params.username,
        toUser: req.body.toUsers[0],
      });
      return res.json({ invites });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/invites/cancel/[inviteId]
 *
 * Returns {action: 'cancelled', invite: {id, gameId, fromUser, toUser, status, createdOn}}
 *
 * Authorization: admin or same-user-as-:username
 */
router.patch(
  `/:username/invites/cancel/:inviteId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const invite = await Invite.update(
        req.params.inviteId,
        req.params.username,
        "cancelled"
      );
      return res.json({ action: "cancelled", invite });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/invites/accept/[inviteId]
 *
 * Returns {action: 'accepted', invite: {id, gameId, fromUser, toUser, status, createdOn}}
 *
 * Authorization: admin or same-user-as-:username
 */
router.patch(
  `/:username/invites/accept/:inviteId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const invite = await Invite.update(
        req.params.inviteId,
        req.params.username,
        "accepted"
      );
      return res.json({ action: "accepted", invite });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username]/invites/deny/[inviteId]
 *
 * Returns {action: 'denied', invite: {id, gameId, fromUser, toUser, status, createdOn}}
 *
 * Authorization: admin or same-user-as-:username
 */
router.patch(
  `/:username/invites/deny/:inviteId`,
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const invite = await Invite.update(
        req.params.inviteId,
        req.params.username,
        "denied"
      );
      return res.json({ action: "denied", invite });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
