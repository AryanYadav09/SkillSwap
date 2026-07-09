const prisma = require("../config/db");
const { getAverageRating } = require("../utils/user");
const chatRepository = require("../repositories/chat.repository");

const getStudentDashboard = async (userId) => {
  const [
    offeredSkills,
    learningSkills,
    totalSkillsOffered,
    totalLearningSkills,
    activeMatches,
    scheduledSessions,
    receivedReviews,
    recentMatchRequests,
    upcomingSessions,
    notifications,
    recentChats,
  ] = await Promise.all([
    prisma.userOfferedSkill.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { skill: true },
    }),
    prisma.userLearningSkill.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { skill: true },
    }),
    prisma.userOfferedSkill.count({ where: { userId } }),
    prisma.userLearningSkill.count({ where: { userId } }),
    prisma.matchRequest.count({
      where: {
        status: {
          in: ["PENDING", "ACCEPTED"],
        },
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    }),
    prisma.session.count({
      where: {
        status: "SCHEDULED",
        matchRequest: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      },
    }),
    prisma.review.findMany({
      where: {
        reviewedUserId: userId,
      },
      select: {
        rating: true,
      },
    }),
    prisma.matchRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
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
    }),
    prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        sessionDate: {
          gte: new Date(),
        },
        matchRequest: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      orderBy: {
        sessionDate: "asc",
      },
      take: 5,
      include: {
        matchRequest: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    chatRepository.listUserChats(userId),
  ]);

  const offeredSkillIds = offeredSkills.map((entry) => entry.skillId);
  const learningSkillIds = learningSkills.map((entry) => entry.skillId);

  const userSelect = {
    id: true,
    name: true,
    username: true,
    college: true,
    department: true,
    semester: true,
    profileImage: true,
    offeredSkills: {
      include: { skill: true },
      take: 3,
    },
    learningSkills: {
      include: { skill: true },
      take: 3,
    },
    reviewsReceived: {
      select: { rating: true },
    },
  };

  // People who want to learn what I can teach
  const teachableStudents = offeredSkillIds.length
    ? await prisma.user.findMany({
        where: {
          id: { not: userId },
          role: "USER",
          status: "ACTIVE",
          learningSkills: {
            some: {
              skillId: { in: offeredSkillIds },
            },
          },
        },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: userSelect,
      })
    : [];

  // People who can teach what I want to learn
  const learnableTeachers = learningSkillIds.length
    ? await prisma.user.findMany({
        where: {
          id: { not: userId },
          role: "USER",
          status: "ACTIVE",
          offeredSkills: {
            some: {
              skillId: { in: learningSkillIds },
            },
          },
        },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: userSelect,
      })
    : [];

  return {
    statistics: {
      totalSkillsOffered,
      totalLearningSkills,
      activeMatches,
      sessionsScheduled: scheduledSessions,
      averageRating: getAverageRating(receivedReviews),
    },
    offeredSkills,
    learningSkills,
    teachableStudents: teachableStudents.map((u) => ({
      ...u,
      averageRating: getAverageRating(u.reviewsReceived),
    })),
    learnableTeachers: learnableTeachers.map((u) => ({
      ...u,
      averageRating: getAverageRating(u.reviewsReceived),
    })),
    recentMatchRequests,
    upcomingSessions,
    notifications,
    recentChats: recentChats.slice(0, 5).map((chat) => ({
      ...chat,
      lastMessage: chat.messages[0] || null,
    })),
  };
};

module.exports = {
  getStudentDashboard,
};
