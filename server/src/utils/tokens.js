const crypto = require("crypto");

const jwt = require("jsonwebtoken");

const env = require("../config/env");

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

const buildAuthPayload = (user) => ({
  sub: user.id,
  role: user.role,
  email: user.email,
});

const createPasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
};

const hashToken = (value) => crypto.createHash("sha256").update(value).digest("hex");

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildAuthPayload,
  createPasswordResetToken,
  hashToken,
  getRefreshCookieOptions,
};
