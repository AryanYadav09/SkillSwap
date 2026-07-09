const userService = require("../services/user.service");
const ApiResponse = require("../utils/apiResponse");

const listBookmarks = async (req, res) => {
  const result = await userService.listBookmarks(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Bookmarks fetched successfully"));
};

const addBookmark = async (req, res) => {
  const result = await userService.addBookmark(req.user.id, req.params.userId);
  res.status(201).json(new ApiResponse(201, result, "Bookmark added successfully"));
};

const removeBookmark = async (req, res) => {
  const result = await userService.removeBookmark(req.user.id, req.params.userId);
  res.status(200).json(new ApiResponse(200, result, "Bookmark removed successfully"));
};

module.exports = {
  listBookmarks,
  addBookmark,
  removeBookmark,
};
