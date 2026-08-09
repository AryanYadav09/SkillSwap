const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, buildSearchFilter, parsePagination } = require("../utils/query");
const { sanitizeUser } = require("../utils/user");
const matchRepository = require("../repositories/match.repository");
const userRepository = require("../repositories/user.repository");
const chatRepository = require("../repositories/chat.repository");
const sessionRepository = require("../repositories/session.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES, MATCH_STATUSES, SESSION_STATUSES } = require("../constants/enums");

const listCompatibleMatches = async (userId, query) => {
  const snapshot = await matchRepository.findSkillSnapshot(userId);

  const offeredSkillIds = snapshot?.offeredSkills.map((skill) => skill.skillId) || [];
  const learningSkillIds = snapshot?.learningSkills.map((skill) => skill.skillId) || [];

  if (!offeredSkillIds.length || !learningSkillIds.length) {
    return buildPaginatedResponse([], 0, {
      page: 1,
      limit: 10,
    });
  }

  const pagination = parsePagination(query, ["createdAt", "name", "college"], "createdAt");
  const filters = [];

  if (query.search) {
    filters.push({
      OR: [
        { name: buildSearchFilter(query.search) },
        { username: buildSearchFilter(query.search) },
        { college: buildSearchFilter(query.search) },
      ],
    });
  }

  if (query.category) {
    filters.push({
      OR: [
        {
          offeredSkills: {
            some: {
              skill: {
                category: buildSearchFilter(query.category),
              },
            },
          },
        },
        {
          learningSkills: {
            some: {
              skill: {
                category: buildSearchFilter(query.category),
              },
            },
          },
        },
      ],
    });
  }

  const extraWhere = {
    ...(query.college
      ? {
          college: buildSearchFilter(query.college),
        }
      : {}),
    ...(filters.length ? { AND: filters } : {}),
  };

  const [users, total] = await Promise.all([
    matchRepository.findCompatibleUsers({
      userId,
      offeredSkillIds,
      learningSkillIds,
      extraWhere,
      skip: 0,
      take: 100, // Fetch up to 100 for ML ranking
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    matchRepository.countCompatibleUsers({
      userId,
      offeredSkillIds,
      learningSkillIds,
      extraWhere,
    }),
  ]);

  if (!users.length) {
    return buildPaginatedResponse([], total, pagination);
  }

  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8002";
  let rankedUsers = users;

  try {
    const targetUser = await userRepository.findById(userId);
    const response = await fetch(`${mlServiceUrl}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: targetUser,
        candidates: users
      })
    });

    if (response.ok) {
      const mlResult = await response.json();
      if (mlResult.success && Array.isArray(mlResult.recommendations)) {
        const scoreMap = new Map();
        mlResult.recommendations.forEach((rec) => {
          scoreMap.set(rec.candidateId, rec.score);
        });

        // Sort by ML score
        rankedUsers.sort((a, b) => {
          const scoreA = scoreMap.get(a.id) || 0;
          const scoreB = scoreMap.get(b.id) || 0;
          return scoreB - scoreA;
        });

        // Add ML reasoning
        rankedUsers = rankedUsers.map((u) => {
          const rec = mlResult.recommendations.find(r => r.candidateId === u.id);
          if (rec) {
            u.mlScore = rec.matchPercentage;
            u.mlReason = rec.reason;
          }
          return u;
        });
      }
    }
  } catch (error) {
    console.error("ML service failed, using default database sorting", error.message);
  }

  // Apply manual pagination on the ranked results
  const slicedUsers = rankedUsers.slice(pagination.skip, pagination.skip + pagination.limit);

  return buildPaginatedResponse(slicedUsers.map(sanitizeUser), total, pagination);
};

const listMatchRequests = async (userId, query) => {
  const pagination = parsePagination(query, ["createdAt", "updatedAt"], "createdAt");
  const where = query.status ? { status: query.status } : {};

  const [items, total] = await Promise.all([
    matchRepository.listUserMatchRequests({
      userId,
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    matchRepository.countUserMatchRequests({
      userId,
      where,
    }),
  ]);

  return buildPaginatedResponse(items, total, pagination);
};

const sendMatchRequest = async (userId, { receiverId, message, description }) => {
  if (userId === receiverId) {
    throw new ApiError(400, "You cannot send a match request to yourself");
  }

  const receiver = await userRepository.findById(receiverId);

  if (!receiver || receiver.status !== "ACTIVE") {
    throw new ApiError(404, "Receiver not found");
  }

  const snapshot = await matchRepository.findSkillSnapshot(userId);
  const receiverSnapshot = await matchRepository.findSkillSnapshot(receiverId);

  const offeredSkillIds = snapshot?.offeredSkills.map((skill) => skill.skillId) || [];
  const learningSkillIds = snapshot?.learningSkills.map((skill) => skill.skillId) || [];
  const receiverOffered = receiverSnapshot?.offeredSkills.map((skill) => skill.skillId) || [];
  const receiverLearning = receiverSnapshot?.learningSkills.map((skill) => skill.skillId) || [];

  const isCompatible =
    offeredSkillIds.some((skillId) => receiverLearning.includes(skillId)) &&
    learningSkillIds.some((skillId) => receiverOffered.includes(skillId));

  if (!isCompatible) {
    throw new ApiError(400, "These users do not currently satisfy the barter matching rule");
  }

  const pendingMatch = await matchRepository.findPendingBetweenUsers(userId, receiverId);

  if (pendingMatch) {
    throw new ApiError(409, "A pending match request already exists between these users");
  }

  const matchRequest = await matchRepository.createMatchRequest({
    senderId: userId,
    receiverId,
    message,
    description,
  });

  await notificationService.notify({
    userId: receiverId,
    title: "New match request",
    message: `${matchRequest.sender.name} wants to exchange skills with you.`,
    type: NOTIFICATION_TYPES.MATCH_REQUEST,
    entityId: matchRequest.id,
  });

  return matchRequest;
};

const changeMatchStatus = async (userId, matchRequestId, nextStatus) => {
  const matchRequest = await matchRepository.findMatchRequestById(matchRequestId);

  if (!matchRequest) {
    throw new ApiError(404, "Match request not found");
  }

  const isSender = matchRequest.senderId === userId;
  const isReceiver = matchRequest.receiverId === userId;

  if (!isSender && !isReceiver) {
    throw new ApiError(403, "You are not part of this match request");
  }

  if (matchRequest.status === nextStatus) {
    return matchRequest; // Idempotent
  }

  if (nextStatus === MATCH_STATUSES.ACCEPTED || nextStatus === MATCH_STATUSES.REJECTED) {
    if (!isReceiver) {
      throw new ApiError(403, "Only the receiver can respond to this request");
    }
    if (matchRequest.status !== MATCH_STATUSES.PENDING) {
      throw new ApiError(400, "This match request is no longer pending");
    }
  }

  if (nextStatus === MATCH_STATUSES.CANCELLED) {
    if (!isSender) {
      throw new ApiError(403, "Only the sender can cancel this request");
    }
    if (matchRequest.status !== MATCH_STATUSES.PENDING) {
      throw new ApiError(400, "This match request is no longer pending");
    }
  }

  if (nextStatus === MATCH_STATUSES.COMPLETED) {
    if (matchRequest.status !== MATCH_STATUSES.ACCEPTED) {
      throw new ApiError(400, "Only accepted matches can be completed");
    }
  }

  const updatedMatch = await matchRepository.updateMatchRequest(matchRequestId, {
    status: nextStatus,
  });

  if (nextStatus === MATCH_STATUSES.ACCEPTED) {
    await chatRepository.getOrCreateChat(matchRequest.senderId, matchRequest.receiverId);

    // Auto-create a session
    const session = await sessionRepository.createSession({
      matchRequestId: matchRequest.id,
      createdById: matchRequest.senderId,
      title: "Skill Exchange Session",
      description: "Auto-generated session for exchanging skills.",
      sessionDate: new Date().toISOString(),
      duration: 60,
      status: SESSION_STATUSES.SCHEDULED,
    });

    await notificationService.notify({
      userId: matchRequest.senderId,
      title: "Match request accepted",
      message: `${matchRequest.receiver.name} accepted your request and a session has been automatically scheduled.`,
      type: NOTIFICATION_TYPES.MATCH_ACCEPTED,
      entityId: matchRequest.id,
    });
  }

  if (nextStatus === MATCH_STATUSES.REJECTED) {
    await notificationService.notify({
      userId: matchRequest.senderId,
      title: "Match request rejected",
      message: `${matchRequest.receiver.name} declined your request.`,
      type: NOTIFICATION_TYPES.MATCH_REJECTED,
      entityId: matchRequest.id,
    });
  }

  return updatedMatch;
};

module.exports = {
  listCompatibleMatches,
  listMatchRequests,
  sendMatchRequest,
  changeMatchStatus,
};
