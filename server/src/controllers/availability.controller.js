const availabilityService = require("../services/availability.service");
const ApiResponse = require("../utils/apiResponse");

const createAvailability = async (req, res) => {
  const result = await availabilityService.createAvailability(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, "Availability created successfully"));
};

const getMyAvailability = async (req, res) => {
  const result = await availabilityService.getMyAvailability(req.user.id);
  res.status(200).json(new ApiResponse(200, result, "Availability fetched successfully"));
};

const getUserAvailability = async (req, res) => {
  const result = await availabilityService.getUserAvailability(req.params.userId);
  res.status(200).json(new ApiResponse(200, result, "User availability fetched successfully"));
};

const updateAvailability = async (req, res) => {
  const result = await availabilityService.updateAvailability(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Availability updated successfully"));
};

const deleteAvailability = async (req, res) => {
  const result = await availabilityService.deleteAvailability(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Availability deleted successfully"));
};

const toggleAvailability = async (req, res) => {
  const result = await availabilityService.toggleAvailability(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Availability toggled successfully"));
};

module.exports = {
  createAvailability,
  getMyAvailability,
  getUserAvailability,
  updateAvailability,
  deleteAvailability,
  toggleAvailability,
};
