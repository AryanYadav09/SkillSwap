const prisma = require("../config/db");

const availabilityInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
};

const findById = (id) =>
  prisma.availability.findUnique({
    where: { id },
    include: availabilityInclude,
  });

const findByUserId = (userId) =>
  prisma.availability.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: availabilityInclude,
  });

const findActiveByUserId = (userId) =>
  prisma.availability.findMany({
    where: { userId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: availabilityInclude,
  });

const create = (data) =>
  prisma.availability.create({
    data,
    include: availabilityInclude,
  });

const update = (id, data) =>
  prisma.availability.update({
    where: { id },
    data,
    include: availabilityInclude,
  });

const remove = (id) =>
  prisma.availability.delete({
    where: { id },
  });

const findOverlapping = ({ userId, dayOfWeek, startTime, endTime, excludeId }) =>
  prisma.availability.findMany({
    where: {
      userId,
      dayOfWeek,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

module.exports = {
  findById,
  findByUserId,
  findActiveByUserId,
  create,
  update,
  remove,
  findOverlapping,
};
