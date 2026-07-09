const dashboardService = require("../services/dashboard.service");
const ApiResponse = require("../utils/apiResponse");

const getDashboard = async (req, res) => {
  const result = await dashboardService.getStudentDashboard(req.user.id);
  res.status(200).json(new ApiResponse(200, result, "Dashboard fetched successfully"));
};

module.exports = {
  getDashboard,
};
