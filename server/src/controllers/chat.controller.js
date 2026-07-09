const chatService = require("../services/chat.service");
const ApiResponse = require("../utils/apiResponse");

const listChats = async (req, res) => {
  const result = await chatService.listChats(req.user.id);
  res.status(200).json(new ApiResponse(200, result, "Chats fetched successfully"));
};

const getChatById = async (req, res) => {
  const result = await chatService.getChatById(req.user.id, req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Chat fetched successfully"));
};

module.exports = {
  listChats,
  getChatById,
};
