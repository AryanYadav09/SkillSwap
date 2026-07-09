const reportService = require("../services/report.service");
const ApiResponse = require("../utils/apiResponse");

const listReports = async (req, res) => {
  const result = await reportService.listMyReports(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Reports fetched successfully"));
};

const createReport = async (req, res) => {
  const result = await reportService.createReport(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, "Report submitted successfully"));
};

module.exports = {
  listReports,
  createReport,
};
