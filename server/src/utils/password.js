const bcrypt = require("bcryptjs");

const env = require("../config/env");

const hashPassword = (password) => bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

module.exports = {
  hashPassword,
  comparePassword,
};
