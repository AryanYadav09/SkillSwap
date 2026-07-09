const adminService = require("../services/admin.service");
const ApiResponse = require("../utils/apiResponse");

const getDashboard = async (_req, res) => {
  const result = await adminService.getAdminDashboard();
  res.status(200).json(new ApiResponse(200, result, "Admin dashboard fetched"));
};

const listUsers = async (req, res) => {
  const result = await adminService.listUsers(req.query);
  res.status(200).json(new ApiResponse(200, result, "Admin users fetched"));
};

const updateUserStatus = async (req, res) => {
  const result = await adminService.updateUserStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, "User status updated"));
};

const deleteUser = async (req, res) => {
  const result = await adminService.deleteUser(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "User deleted successfully"));
};

const listSkills = async (req, res) => {
  const result = await adminService.listSkills(req.query);
  res.status(200).json(new ApiResponse(200, result, "Admin skills fetched"));
};

const deleteSkill = async (req, res) => {
  const result = await adminService.deleteSkill(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Skill deleted successfully"));
};

const listReports = async (req, res) => {
  const result = await adminService.listReports(req.query);
  res.status(200).json(new ApiResponse(200, result, "Admin reports fetched"));
};

const updateReportStatus = async (req, res) => {
  const result = await adminService.updateReportStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Report status updated"));
};

module.exports = {
  getDashboard,
  listUsers,
  updateUserStatus,
  deleteUser,
  listSkills,
  deleteSkill,
  listReports,
  updateReportStatus,
};
