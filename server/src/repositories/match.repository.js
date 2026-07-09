const prisma = require("../config/db");
const { userSummaryInclude } = require("./user.repository");

const matchInclude = {
  sender: {
    include: userSummaryInclude,
  },
  receiver: {
    include: userSummaryInclude,
  },
  sessions: {
    orderBy: {
      sessionDate: "asc",
    },
  },
};

const findSkillSnapshot = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      offeredSkills: {
        select: {
          skillId: true,
        },
      },
      learningSkills: {
        select: {
          skillId: true,
        },
      },
    },
  });

const findCompatibleUsers = ({ userId, offeredSkillIds, learningSkillIds, extraWhere, skip, take, orderBy }) =>
  prisma.user.findMany({
    where: {
      id: {
        not: userId,
      },
      role: "USER",
      status: "ACTIVE",
      offeredSkills: {
        some: {
          skillId: {
            in: learningSkillIds,
          },
        },
      },
      learningSkills: {
        some: {
          skillId: {
            in: offeredSkillIds,
          },
        },
      },
      ...extraWhere,
    },
    skip,
    take,
    orderBy,
    include: userSummaryInclude,
  });

const countCompatibleUsers = ({ userId, offeredSkillIds, learningSkillIds, extraWhere }) =>
  prisma.user.count({
    where: {
      id: {
        not: userId,
      },
      role: "USER",
      status: "ACTIVE",
      offeredSkills: {
        some: {
          skillId: {
            in: learningSkillIds,
          },
        },
      },
      learningSkills: {
        some: {
          skillId: {
            in: offeredSkillIds,
          },
        },
      },
      ...extraWhere,
    },
  });

const findPendingBetweenUsers = (userAId, userBId) =>
  prisma.matchRequest.findFirst({
    where: {
      status: "PENDING",
      OR: [
        {
          senderId: userAId,
          receiverId: userBId,
        },
        {
          senderId: userBId,
          receiverId: userAId,
        },
      ],
    },
  });

const findMatchRequestById = (id) =>
  prisma.matchRequest.findUnique({
    where: { id },
    include: matchInclude,
  });

const createMatchRequest = (data) =>
  prisma.matchRequest.create({
    data,
    include: matchInclude,
  });

const updateMatchRequest = (id, data) =>
  prisma.matchRequest.update({
    where: { id },
    data,
    include: matchInclude,
  });

const listUserMatchRequests = ({ userId, where, skip, take, orderBy }) =>
  prisma.matchRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      ...where,
    },
    skip,
    take,
    orderBy,
    include: matchInclude,
  });

const countUserMatchRequests = ({ userId, where }) =>
  prisma.matchRequest.count({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      ...where,
    },
  });

module.exports = {
  findSkillSnapshot,
  findCompatibleUsers,
  countCompatibleUsers,
  findPendingBetweenUsers,
  findMatchRequestById,
  createMatchRequest,
  updateMatchRequest,
  listUserMatchRequests,
  countUserMatchRequests,
};
