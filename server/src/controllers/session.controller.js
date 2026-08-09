const sessionService = require("../services/session.service");
const ApiResponse = require("../utils/apiResponse");

const listSessions = async (req, res) => {
  const result = await sessionService.listSessions(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Sessions fetched successfully"));
};

const getSessionById = async (req, res) => {
  const result = await sessionService.getSessionById(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Session fetched successfully"));
};

const createSession = async (req, res) => {
  const result = await sessionService.createSession(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, "Session created successfully"));
};

const updateSession = async (req, res) => {
  const result = await sessionService.updateSession(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Session updated successfully"));
};

const cancelSession = async (req, res) => {
  const result = await sessionService.changeSessionStatus(req.user.id, req.params.id, "CANCELLED");
  res.status(200).json(new ApiResponse(200, result, "Session cancelled successfully"));
};

const completeSession = async (req, res) => {
  const result = await sessionService.changeSessionStatus(req.user.id, req.params.id, "COMPLETED");
  res.status(200).json(new ApiResponse(200, result, "Session completed successfully"));
};

const acceptSession = async (req, res) => {
  const result = await sessionService.changeSessionStatus(req.user.id, req.params.id, "SCHEDULED");
  res.status(200).json(new ApiResponse(200, result, "Session accepted successfully"));
};

const rejectSession = async (req, res) => {
  const result = await sessionService.changeSessionStatus(req.user.id, req.params.id, "REJECTED");
  res.status(200).json(new ApiResponse(200, result, "Session rejected successfully"));
};

const getByMeetingId = async (req, res) => {
  const result = await sessionService.getSessionByMeetingId(req.user.id, req.params.meetingId);
  res.status(200).json(new ApiResponse(200, result, "Meeting fetched successfully"));
};

module.exports = {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  cancelSession,
  completeSession,
  acceptSession,
  rejectSession,
  getByMeetingId,
};
