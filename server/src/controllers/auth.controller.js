const authService = require("../services/auth.service");
const ApiResponse = require("../utils/apiResponse");
const env = require("../config/env");
const { getRefreshCookieOptions, verifyRefreshToken } = require("../utils/tokens");

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(env.COOKIE_NAME, refreshToken, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(env.COOKIE_NAME, getRefreshCookieOptions());
};

const register = async (req, res) => {
  const result = await authService.register(req.body);
  setRefreshCookie(res, result.refreshToken);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        "Account created successfully",
      ),
    );
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Login successful",
    ),
  );
};

const logout = async (req, res) => {
  await authService.logout(req.user.id);
  clearRefreshCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies[env.COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const payload = verifyRefreshToken(refreshToken);
  const result = await authService.refreshSession(payload, refreshToken);
  setRefreshCookie(res, result.refreshToken);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Session refreshed successfully",
    ),
  );
};

const forgotPassword = async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(200).json(new ApiResponse(200, null, "Password has been reset"));
};

const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  clearRefreshCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
};

const me = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json(new ApiResponse(200, user, "Current user fetched"));
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
