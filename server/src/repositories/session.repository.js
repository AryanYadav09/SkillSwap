const prisma = require("../config/db");

const sessionInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
  matchRequest: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
        },
      },
    },
  },
  reviews: true,
};

const findSessionById = (id) =>
  prisma.session.findUnique({
    where: { id },
    include: sessionInclude,
  });

const createSession = (data) =>
  prisma.session.create({
    data,
    include: sessionInclude,
  });

const updateSession = (id, data) =>
  prisma.session.update({
    where: { id },
    data,
    include: sessionInclude,
  });

const listUserSessions = ({ userId, where, skip, take, orderBy }) =>
  prisma.session.findMany({
    where: {
      matchRequest: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      ...where,
    },
    skip,
    take,
    orderBy,
    include: sessionInclude,
  });

const countUserSessions = ({ userId, where }) =>
  prisma.session.count({
    where: {
      matchRequest: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      ...where,
    },
  });

const findSessionByMeetingId = (meetingId) =>
  prisma.session.findUnique({
    where: { meetingId },
    include: sessionInclude,
  });

module.exports = {
  findSessionById,
  findSessionByMeetingId,
  createSession,
  updateSession,
  listUserSessions,
  countUserSessions,
};
