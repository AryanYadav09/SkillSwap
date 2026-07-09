const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, buildSearchFilter, parsePagination } = require("../utils/query");
const prisma = require("../config/db");
const userRepository = require("../repositories/user.repository");
const skillRepository = require("../repositories/skill.repository");
const reportRepository = require("../repositories/report.repository");
const { sanitizeUser } = require("../utils/user");

const getAdminDashboard = async () => {
  const [totalUsers, totalSkills, totalMatches, totalSessions, pendingReports] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.skill.count(),
      prisma.matchRequest.count(),
      prisma.session.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

  return {
    totalUsers,
    totalSkills,
    totalMatches,
    totalSessions,
    reportsPending: pendingReports,
  };
};

const listUsers = async (query) => {
  const pagination = parsePagination(query, ["createdAt", "name", "college"], "createdAt");
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: buildSearchFilter(query.search) },
            { username: buildSearchFilter(query.search) },
            { email: buildSearchFilter(query.search) },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    userRepository.listUsers({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    userRepository.countUsers(where),
  ]);

  return buildPaginatedResponse(users.map(sanitizeUser), total, pagination);
};

const updateUserStatus = async (userId, status) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return userRepository.updateUser(userId, { status });
};

const deleteUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await userRepository.deleteUser(userId);
  return { success: true };
};

const listSkills = async (query) => {
  const pagination = parsePagination(query, ["createdAt", "name", "category"], "createdAt");
  const where = {
    ...(query.search
      ? {
          OR: [
            { name: buildSearchFilter(query.search) },
            { category: buildSearchFilter(query.search) },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    skillRepository.listCatalogSkills({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    skillRepository.countCatalogSkills(where),
  ]);

  return buildPaginatedResponse(items, total, pagination);
};

const deleteSkill = async (skillId) => {
  await skillRepository.deleteCatalogSkill(skillId);
  return { success: true };
};

const listReports = async (query) => {
  const pagination = parsePagination(query, ["createdAt"], "createdAt");
  const where = {
    ...(query.status ? { status: query.status } : {}),
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

const updateReportStatus = async (reportId, payload) => {
  const report = await reportRepository.findReportById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  return reportRepository.updateReport(reportId, payload);
};

module.exports = {
  getAdminDashboard,
  listUsers,
  updateUserStatus,
  deleteUser,
  listSkills,
  deleteSkill,
  listReports,
  updateReportStatus,
};
