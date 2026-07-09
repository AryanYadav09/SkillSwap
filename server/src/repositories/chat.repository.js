const prisma = require("../config/db");
const { normalizeChatPair } = require("../utils/chat");

const participantSelect = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  college: true,
  department: true,
  semester: true,
};

const chatInclude = {
  user1: {
    select: participantSelect,
  },
  user2: {
    select: participantSelect,
  },
};

const getOrCreateChat = async (userAId, userBId) => {
  const [user1Id, user2Id] = normalizeChatPair(userAId, userBId);

  return prisma.chat.upsert({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },
    create: {
      user1Id,
      user2Id,
    },
    update: {},
    include: chatInclude,
  });
};

const findChatById = (id) =>
  prisma.chat.findUnique({
    where: { id },
    include: {
      ...chatInclude,
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
            select: participantSelect,
          },
        },
      },
    },
  });

const listUserChats = (userId) =>
  prisma.chat.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      ...chatInclude,
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
            select: participantSelect,
          },
        },
      },
    },
  });

const listMessages = ({ chatId, skip, take }) =>
  prisma.message.findMany({
    where: { chatId },
    skip,
    take,
    orderBy: {
      createdAt: "asc",
    },
    include: {
      sender: {
        select: participantSelect,
      },
    },
  });

const countMessages = (chatId) =>
  prisma.message.count({
    where: { chatId },
  });

const createMessage = (data) =>
  prisma.message.create({
    data,
    include: {
      sender: {
        select: participantSelect,
      },
    },
  });

const touchChat = (chatId) =>
  prisma.chat.update({
    where: { id: chatId },
    data: {
      updatedAt: new Date(),
    },
  });

const markMessagesSeen = (chatId, viewerId) =>
  prisma.message.updateMany({
    where: {
      chatId,
      senderId: {
        not: viewerId,
      },
      isSeen: false,
    },
    data: {
      isSeen: true,
    },
  });

const countUnreadMessages = (chatId, viewerId) =>
  prisma.message.count({
    where: {
      chatId,
      senderId: {
        not: viewerId,
      },
      isSeen: false,
    },
  });

module.exports = {
  getOrCreateChat,
  findChatById,
  listUserChats,
  listMessages,
  countMessages,
  createMessage,
  touchChat,
  markMessagesSeen,
  countUnreadMessages,
};
