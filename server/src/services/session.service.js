const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, parsePagination } = require("../utils/query");
const sessionRepository = require("../repositories/session.repository");
const matchRepository = require("../repositories/match.repository");
const notificationService = require("./notification.service");
const { MATCH_STATUSES, NOTIFICATION_TYPES, SESSION_STATUSES } = require("../constants/enums");

const getOtherUserId = (matchRequest, userId) =>
  matchRequest.senderId === userId ? matchRequest.receiverId : matchRequest.senderId;

const listSessions = async (userId, query) => {
  const pagination = parsePagination(query, ["sessionDate", "createdAt"], "sessionDate");
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.upcoming === "true"
      ? {
          sessionDate: {
            gte: new Date(),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    sessionRepository.listUserSessions({
      userId,
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    sessionRepository.countUserSessions({
      userId,
      where,
    }),
  ]);

  return buildPaginatedResponse(items, total, pagination);
};

const getSessionById = async (userId, sessionId) => {
  const session = await sessionRepository.findSessionById(sessionId);

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  const isParticipant =
    session.matchRequest.senderId === userId || session.matchRequest.receiverId === userId;

  if (!isParticipant) {
    throw new ApiError(403, "You do not have access to this session");
  }

  return session;
};

const createSession = async (userId, payload) => {
  const matchRequest = await matchRepository.findMatchRequestById(payload.matchRequestId);

  if (!matchRequest) {
    throw new ApiError(404, "Match request not found");
  }

  const isParticipant =
    matchRequest.senderId === userId || matchRequest.receiverId === userId;

  if (!isParticipant) {
    throw new ApiError(403, "You are not part of this match request");
  }

  if (matchRequest.status !== MATCH_STATUSES.ACCEPTED) {
    throw new ApiError(400, "Sessions can only be created for accepted matches");
  }

  const session = await sessionRepository.createSession({
    ...payload,
    createdById: userId,
  });

  await notificationService.notify({
    userId: getOtherUserId(matchRequest, userId),
    title: "Session scheduled",
    message: `${session.createdBy.name} scheduled "${session.title}".`,
    type: NOTIFICATION_TYPES.SESSION_SCHEDULED,
    entityId: session.id,
  });

  return session;
};

const updateSession = async (userId, sessionId, payload) => {
  const session = await getSessionById(userId, sessionId);

  if (session.status !== SESSION_STATUSES.SCHEDULED) {
    throw new ApiError(400, "Only scheduled sessions can be updated");
  }

  return sessionRepository.updateSession(sessionId, payload);
};

const changeSessionStatus = async (userId, sessionId, status) => {
  const session = await getSessionById(userId, sessionId);

  if (session.status === status) {
    return session;
  }

  return sessionRepository.updateSession(sessionId, {
    status,
  });
};

module.exports = {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  changeSessionStatus,
};
