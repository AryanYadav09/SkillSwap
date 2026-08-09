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

  if (status === SESSION_STATUSES.SCHEDULED) {
    if (session.status !== SESSION_STATUSES.PENDING) {
      throw new ApiError(400, "Only pending sessions can be accepted");
    }
    const isReceiver = session.createdById !== userId;
    if (!isReceiver) {
      throw new ApiError(403, "Only the invitee can accept the session");
    }
    const accepterName = session.matchRequest.senderId === userId ? session.matchRequest.sender.name : session.matchRequest.receiver.name;
    await notificationService.notify({
      userId: session.createdById,
      title: "Session accepted",
      message: `${accepterName} accepted "${session.title}".`,
      type: NOTIFICATION_TYPES.SESSION_ACCEPTED,
      entityId: session.id,
    });
  } else if (status === SESSION_STATUSES.REJECTED) {
    if (session.status !== SESSION_STATUSES.PENDING) {
      throw new ApiError(400, "Only pending sessions can be rejected");
    }
    const isReceiver = session.createdById !== userId;
    if (!isReceiver) {
      throw new ApiError(403, "Only the invitee can reject the session");
    }
    const rejecterName = session.matchRequest.senderId === userId ? session.matchRequest.sender.name : session.matchRequest.receiver.name;
    await notificationService.notify({
      userId: session.createdById,
      title: "Session rejected",
      message: `${rejecterName} rejected "${session.title}".`,
      type: NOTIFICATION_TYPES.SESSION_REJECTED,
      entityId: session.id,
    });
  } else if (status === SESSION_STATUSES.CANCELLED) {
     if (session.status === SESSION_STATUSES.COMPLETED) {
       throw new ApiError(400, "Cannot cancel a completed session");
     }
  }

  return sessionRepository.updateSession(sessionId, {
    status,
  });
};

const getSessionByMeetingId = async (userId, meetingId) => {
  const session = await sessionRepository.findSessionByMeetingId(meetingId);

  if (!session) {
    throw new ApiError(404, "Meeting not found");
  }

  const isParticipant =
    session.matchRequest.senderId === userId || session.matchRequest.receiverId === userId;

  if (!isParticipant) {
    throw new ApiError(403, "You do not have access to this meeting");
  }

  return session;
};

module.exports = {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  changeSessionStatus,
  getSessionByMeetingId,
};
