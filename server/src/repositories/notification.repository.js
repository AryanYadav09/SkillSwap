const prisma = require("../config/db");

const createNotification = (data) =>
  prisma.notification.create({
    data,
  });

const listNotifications = ({ userId, skip, take }) =>
  prisma.notification.findMany({
    where: { userId },
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
  });

const countNotifications = (userId) =>
  prisma.notification.count({
    where: { userId },
  });

const findNotificationById = (id) =>
  prisma.notification.findUnique({
    where: { id },
  });

const updateNotification = (id, data) =>
  prisma.notification.update({
    where: { id },
    data,
  });

const updateManyNotifications = (userId, data) =>
  prisma.notification.updateMany({
    where: { userId },
    data,
  });

const deleteNotification = (id) =>
  prisma.notification.delete({
    where: { id },
  });

const countUnreadNotifications = (userId) =>
  prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

module.exports = {
  createNotification,
  listNotifications,
  countNotifications,
  findNotificationById,
  updateNotification,
  updateManyNotifications,
  deleteNotification,
  countUnreadNotifications,
};
