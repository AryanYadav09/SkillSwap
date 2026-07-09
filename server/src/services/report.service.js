const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, parsePagination } = require("../utils/query");
const reportRepository = require("../repositories/report.repository");
const userRepository = require("../repositories/user.repository");

const createReport = async (userId, payload) => {
  if (userId === payload.reportedUserId) {
    throw new ApiError(400, "You cannot report yourself");
  }

  const reportedUser = await userRepository.findById(payload.reportedUserId);

  if (!reportedUser) {
    throw new ApiError(404, "Reported user not found");
  }

  return reportRepository.createReport({
    ...payload,
    reporterId: userId,
  });
};

const listMyReports = async (userId, query) => {
  const pagination = parsePagination(query, ["createdAt"], "createdAt");
  const where = {
    reporterId: userId,
  };

  const [items, total] = await Promise.all([
    reportRepository.listReports({
      where,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    reportRepository.countReports(where),
  ]);

  return buildPaginatedResponse(items, total, pagination);
};

module.exports = {
  createReport,
  listMyReports,
};
