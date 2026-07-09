const prisma = require("../config/db");

const userSummaryInclude = {
  offeredSkills: {
    include: {
      skill: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
  },
  learningSkills: {
    include: {
      skill: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
  },
  reviewsReceived: {
    select: {
      rating: true,
    },
  },
  _count: {
    select: {
      offeredSkills: true,
      learningSkills: true,
      reviewsReceived: true,
      bookmarks: true,
    },
  },
};

const userProfileInclude = {
  offeredSkills: {
    include: {
      skill: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  learningSkills: {
    include: {
      skill: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  reviewsReceived: {
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  reviewsWritten: {
    include: {
      reviewedUser: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
        },
      },
      session: {
        select: {
          id: true,
          title: true,
          sessionDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  _count: {
    select: {
      offeredSkills: true,
      learningSkills: true,
      reviewsReceived: true,
      notifications: true,
      bookmarks: true,
    },
  },
};

const bookmarkInclude = {
  bookmarkedUser: {
    include: userSummaryInclude,
  },
};

const findByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
  });

const findByUsername = (username) =>
  prisma.user.findUnique({
    where: { username },
  });

const findById = (id) =>
  prisma.user.findUnique({
    where: { id },
  });

const findProfileById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: userProfileInclude,
  });

const createUser = (data) => prisma.user.create({ data });

const updateUser = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
  });

const listUsers = ({ where, skip, take, orderBy }) =>
  prisma.user.findMany({
    where,
    skip,
    take,
    orderBy,
    include: userSummaryInclude,
  });

const countUsers = (where) => prisma.user.count({ where });

const createBookmark = (data) =>
  prisma.bookmark.create({
    data,
    include: bookmarkInclude,
  });

const findBookmark = (userId, bookmarkedUserId) =>
  prisma.bookmark.findUnique({
    where: {
      userId_bookmarkedUserId: {
        userId,
        bookmarkedUserId,
      },
    },
    include: bookmarkInclude,
  });

const deleteBookmark = (userId, bookmarkedUserId) =>
  prisma.bookmark.delete({
    where: {
      userId_bookmarkedUserId: {
        userId,
        bookmarkedUserId,
      },
    },
  });

const listBookmarks = ({ userId, skip, take }) =>
  prisma.bookmark.findMany({
    where: { userId },
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: bookmarkInclude,
  });

const countBookmarks = (userId) =>
  prisma.bookmark.count({
    where: { userId },
  });

const deleteUser = (id) =>
  prisma.user.delete({
    where: { id },
  });

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  findProfileById,
  createUser,
  updateUser,
  listUsers,
  countUsers,
  createBookmark,
  findBookmark,
  deleteBookmark,
  listBookmarks,
  countBookmarks,
  deleteUser,
  userSummaryInclude,
  userProfileInclude,
};
