const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, parsePagination } = require("../utils/query");
const sessionRepository = require("../repositories/session.repository");
const reviewRepository = require("../repositories/review.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES, SESSION_STATUSES } = require("../constants/enums");

const listReviews = async (currentUserId, query) => {
  const pagination = parsePagination(query, ["createdAt"], "createdAt");
  const reviewedUserId = query.userId || currentUserId;
  const where = {
    reviewedUserId,
  };

  const [items, total] = await Promise.all([
    reviewRepository.listReviews({
      where,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    reviewRepository.countReviews(where),
  ]);

  return buildPaginatedResponse(items, total, pagination);
};

const createReview = async (userId, payload) => {
  const session = await sessionRepository.findSessionById(payload.sessionId);

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  if (session.status !== SESSION_STATUSES.COMPLETED) {
    throw new ApiError(400, "Reviews can only be added after a completed session");
  }

  const participantIds = [session.matchRequest.senderId, session.matchRequest.receiverId];

  if (!participantIds.includes(userId) || !participantIds.includes(payload.reviewedUserId)) {
    throw new ApiError(403, "Review participants do not match this session");
  }

  if (userId === payload.reviewedUserId) {
    throw new ApiError(400, "You cannot review yourself");
  }

  const existingReview = await reviewRepository.findReviewBySessionAndReviewer(
    payload.sessionId,
    userId,
  );

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this session");
  }

  const review = await reviewRepository.createReview({
    ...payload,
    reviewerId: userId,
  });

  await notificationService.notify({
    userId: payload.reviewedUserId,
    title: "New review received",
    message: `${review.reviewer.name} left feedback for your session.`,
    type: NOTIFICATION_TYPES.REVIEW_ADDED,
    entityId: review.id,
  });

  return review;
};

module.exports = {
  listReviews,
  createReview,
};
