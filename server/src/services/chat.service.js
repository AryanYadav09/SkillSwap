const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, parsePagination } = require("../utils/query");
const { getOtherParticipant } = require("../utils/chat");
const { uploadImageBuffer } = require("../utils/cloudinary");
const chatRepository = require("../repositories/chat.repository");
const notificationService = require("./notification.service");
const { emitToUser } = require("../sockets/realtime");
const { NOTIFICATION_TYPES } = require("../constants/enums");

const ensureUserInChat = (chat, userId) => {
  if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
    throw new ApiError(404, "Chat not found");
  }
};

const listChats = async (userId) => {
  const chats = await chatRepository.listUserChats(userId);

  const serialized = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await chatRepository.countUnreadMessages(chat.id, userId);

      return {
        ...chat,
        otherParticipant: getOtherParticipant(chat, userId),
        unreadCount,
        lastMessage: chat.messages[0] || null,
      };
    }),
  );

  return serialized;
};

const getChatById = async (userId, chatId, query) => {
  const chat = await chatRepository.findChatById(chatId);
  ensureUserInChat(chat, userId);

  const pagination = parsePagination(query, ["createdAt"], "createdAt");
  const [messages, total] = await Promise.all([
    chatRepository.listMessages({
      chatId,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    chatRepository.countMessages(chatId),
  ]);

  return {
    chat: {
      ...chat,
      otherParticipant: getOtherParticipant(chat, userId),
    },
    messages: buildPaginatedResponse(messages, total, pagination),
  };
};

const createMessage = async ({ userId, chatId, message, file, imageUrl }) => {
  const chat = await chatRepository.findChatById(chatId);
  ensureUserInChat(chat, userId);

  const uploadedImageUrl =
    imageUrl || (file ? await uploadImageBuffer(file, "skillswap/chat-images") : null);

  if (!message && !uploadedImageUrl) {
    throw new ApiError(400, "A message or image is required");
  }

  const createdMessage = await chatRepository.createMessage({
    chatId,
    senderId: userId,
    message: message || null,
    imageUrl: uploadedImageUrl,
  });
  await chatRepository.touchChat(chatId);

  const recipient = chat.user1Id === userId ? chat.user2 : chat.user1;

  await notificationService.notify({
    userId: recipient.id,
    title: "New message",
    message: `You have a new message from ${createdMessage.sender.name}.`,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    entityId: chatId,
  });

  emitToUser(recipient.id, "chat:message", {
    chatId,
    message: createdMessage,
  });

  return createdMessage;
};

const markChatAsSeen = async (userId, chatId) => {
  const chat = await chatRepository.findChatById(chatId);
  ensureUserInChat(chat, userId);

  await chatRepository.markMessagesSeen(chatId, userId);

  const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;

  emitToUser(otherUserId, "chat:seen", {
    chatId,
    seenBy: userId,
  });

  return {
    success: true,
  };
};

const createOrGetChat = (userAId, userBId) => chatRepository.getOrCreateChat(userAId, userBId);

module.exports = {
  listChats,
  getChatById,
  createMessage,
  markChatAsSeen,
  createOrGetChat,
};
