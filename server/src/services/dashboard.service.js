const prisma = require("../config/db");
const { getAverageRating } = require("../utils/user");
const chatRepository = require("../repositories/chat.repository");
const bookingRepository = require("../repositories/booking.repository");

const getStudentDashboard = async (userId) => {
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

  const [
    offeredSkills,
    learningSkills,
    activeMatches,
    scheduledSessions,
    receivedReviews,
    recentMatchRequests,
    upcomingSessions,
    notifications,
    recentChats,
    teachableStudents,
    learnableTeachers,
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
    chatRepository.listUserChats(userId, 5),
    // teachableStudents (people who want to learn what I teach)
    prisma.user.findMany({
      where: {
        id: { not: userId },
        role: "USER",
        status: "ACTIVE",
        learningSkills: {
          some: {
            skill: {
              offeredBy: {
                some: { userId },
              },
            },
          },
        },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: userSelect,
    }),
    // learnableTeachers (people who can teach what I want to learn)
    prisma.user.findMany({
      where: {
        id: { not: userId },
        role: "USER",
        status: "ACTIVE",
        offeredSkills: {
          some: {
            skill: {
              learners: {
                some: { userId },
              },
            },
          },
        },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: userSelect,
    }),
  ]);

  // Fetch upcoming meetings from the new booking system
  const [upcomingBookedMeetings, meetingsCount] = await Promise.all([
    bookingRepository.findUpcomingMeetings(userId, 5),
    prisma.meeting.count({
      where: {
        OR: [{ hostUserId: userId }, { guestUserId: userId }],
        status: "SCHEDULED",
      },
    }),
  ]);

  // Check which recommended users have active availability
  const allRecommendedIds = [
    ...teachableStudents.map((u) => u.id),
    ...learnableTeachers.map((u) => u.id),
  ];

  const usersWithAvailability = allRecommendedIds.length
    ? await prisma.availability.findMany({
        where: {
          userId: { in: allRecommendedIds },
          isActive: true,
        },
        select: { userId: true },
        distinct: ["userId"],
      })
    : [];

  const availableUserIds = new Set(usersWithAvailability.map((a) => a.userId));

  return {
    statistics: {
      totalSkillsOffered: offeredSkills.length,
      totalLearningSkills: learningSkills.length,
      activeMatches,
      sessionsScheduled: scheduledSessions,
      meetingsScheduled: meetingsCount,
      averageRating: getAverageRating(receivedReviews),
    },
    offeredSkills,
    learningSkills,
    teachableStudents: teachableStudents
      .map((u) => ({
        ...u,
        averageRating: getAverageRating(u.reviewsReceived),
        hasAvailability: availableUserIds.has(u.id),
      }))
      .sort((a, b) => (b.hasAvailability ? 1 : 0) - (a.hasAvailability ? 1 : 0)),
    learnableTeachers: learnableTeachers
      .map((u) => ({
        ...u,
        averageRating: getAverageRating(u.reviewsReceived),
        hasAvailability: availableUserIds.has(u.id),
      }))
      .sort((a, b) => (b.hasAvailability ? 1 : 0) - (a.hasAvailability ? 1 : 0)),
    recentMatchRequests,
    upcomingSessions,
    upcomingMeetings: upcomingBookedMeetings,
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
