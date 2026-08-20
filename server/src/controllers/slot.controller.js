const slotService = require("../services/slot.service");
const ApiResponse = require("../utils/apiResponse");

const getAvailableSlots = async (req, res) => {
  const { userId } = req.params;
  const viewerTimezone = req.query.timezone || "UTC";
  const daysAhead = parseInt(req.query.days, 10) || 14;

  const result = await slotService.getAvailableSlots(userId, viewerTimezone, daysAhead);
  res.status(200).json(new ApiResponse(200, result, "Available slots fetched successfully"));
};

module.exports = {
  getAvailableSlots,
};
