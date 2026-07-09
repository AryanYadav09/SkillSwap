const prisma = require("../config/db");

const reportInclude = {
  reporter: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
  reportedUser: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
};

const createReport = (data) =>
  prisma.report.create({
    data,
    include: reportInclude,
  });

const findReportById = (id) =>
  prisma.report.findUnique({
    where: { id },
    include: reportInclude,
  });

const updateReport = (id, data) =>
  prisma.report.update({
    where: { id },
    data,
    include: reportInclude,
  });

const listReports = ({ where, skip, take }) =>
  prisma.report.findMany({
    where,
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: reportInclude,
  });

const countReports = (where) => prisma.report.count({ where });

module.exports = {
  createReport,
  findReportById,
  updateReport,
  listReports,
  countReports,
};
