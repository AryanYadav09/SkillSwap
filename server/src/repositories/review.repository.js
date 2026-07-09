const prisma = require("../config/db");

const reviewInclude = {
  reviewer: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
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
      status: true,
    },
  },
};

const findReviewBySessionAndReviewer = (sessionId, reviewerId) =>
  prisma.review.findUnique({
    where: {
      sessionId_reviewerId: {
        sessionId,
        reviewerId,
      },
    },
    include: reviewInclude,
  });

const createReview = (data) =>
  prisma.review.create({
    data,
    include: reviewInclude,
  });

const listReviews = ({ where, skip, take }) =>
  prisma.review.findMany({
    where,
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: reviewInclude,
  });

const countReviews = (where) => prisma.review.count({ where });

module.exports = {
  findReviewBySessionAndReviewer,
  createReview,
  listReviews,
  countReviews,
};
