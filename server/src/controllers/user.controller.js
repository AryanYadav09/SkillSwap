const userService = require("../services/user.service");
const ApiResponse = require("../utils/apiResponse");

const listUsers = async (req, res) => {
  const result = await userService.listUsers(req.query, req.user?.id);
  res.status(200).json(new ApiResponse(200, result, "Users fetched successfully"));
};

const getUserById = async (req, res) => {
  const result = await userService.getUserById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Profile fetched successfully"));
};

const updateProfile = async (req, res) => {
  const result = await userService.updateProfile(req.user.id, req.body, req.file);
  res.status(200).json(new ApiResponse(200, result, "Profile updated successfully"));
};

module.exports = {
  listUsers,
  getUserById,
  updateProfile,
};
