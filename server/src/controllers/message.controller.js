const chatService = require("../services/chat.service");
const ApiResponse = require("../utils/apiResponse");

const createMessage = async (req, res) => {
  const result = await chatService.createMessage({
    userId: req.user.id,
    chatId: req.body.chatId,
    message: req.body.message,
    file: req.file,
  });

  res.status(201).json(new ApiResponse(201, result, "Message sent successfully"));
};

const getMessages = async (req, res) => {
  const result = await chatService.getChatById(req.user.id, req.params.chatId, req.query);
  res.status(200).json(new ApiResponse(200, result.messages, "Messages fetched successfully"));
};

const markSeen = async (req, res) => {
  const result = await chatService.markChatAsSeen(req.user.id, req.params.chatId);
  res.status(200).json(new ApiResponse(200, result, "Messages marked as seen"));
};

module.exports = {
  createMessage,
  getMessages,
  markSeen,
};
