"use strict";

const SECRET_KEY = process.env.SECRET_KEY || "blackMamba24";

const PORT = +process.env.PORT || 3001;

function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? "pugdb_test"
    : process.env.DATABASE_URL || "pugdb";
}

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
