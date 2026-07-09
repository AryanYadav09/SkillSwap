const matchService = require("../services/match.service");
const ApiResponse = require("../utils/apiResponse");

const listCompatibleMatches = async (req, res) => {
  const result = await matchService.listCompatibleMatches(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Compatible users fetched"));
};

const listMatchRequests = async (req, res) => {
  const result = await matchService.listMatchRequests(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Match requests fetched"));
};

const sendMatchRequest = async (req, res) => {
  const result = await matchService.sendMatchRequest(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, "Match request sent"));
};

const acceptMatchRequest = async (req, res) => {
  const result = await matchService.changeMatchStatus(req.user.id, req.params.id, "ACCEPTED");
  res.status(200).json(new ApiResponse(200, result, "Match request accepted"));
};

const rejectMatchRequest = async (req, res) => {
  const result = await matchService.changeMatchStatus(req.user.id, req.params.id, "REJECTED");
  res.status(200).json(new ApiResponse(200, result, "Match request rejected"));
};

const cancelMatchRequest = async (req, res) => {
  const result = await matchService.changeMatchStatus(req.user.id, req.params.id, "CANCELLED");
  res.status(200).json(new ApiResponse(200, result, "Match request cancelled"));
};

const completeMatchRequest = async (req, res) => {
  const result = await matchService.changeMatchStatus(req.user.id, req.params.id, "COMPLETED");
  res.status(200).json(new ApiResponse(200, result, "Match marked as completed"));
};

module.exports = {
  listCompatibleMatches,
  listMatchRequests,
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  cancelMatchRequest,
  completeMatchRequest,
};
