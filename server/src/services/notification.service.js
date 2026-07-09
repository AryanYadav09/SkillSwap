const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, parsePagination } = require("../utils/query");
const notificationRepository = require("../repositories/notification.repository");
const { emitToUser } = require("../sockets/realtime");

const notify = async ({ userId, title, message, type, entityId }) => {
  const notification = await notificationRepository.createNotification({
    userId,
    title,
    message,
    type,
    entityId,
  });

  emitToUser(userId, "notification:new", notification);

  return notification;
};

const listNotifications = async (userId, query) => {
  const pagination = parsePagination(query, ["createdAt"], "createdAt");
  const [items, total, unreadCount] = await Promise.all([
    notificationRepository.listNotifications({
      userId,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    notificationRepository.countNotifications(userId),
    notificationRepository.countUnreadNotifications(userId),
  ]);

  return {
    ...buildPaginatedResponse(items, total, pagination),
    unreadCount,
  };
};

const markRead = async (userId, notificationId) => {
  const notification = await notificationRepository.findNotificationById(notificationId);

  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, "Notification not found");
  }

  return notificationRepository.updateNotification(notificationId, {
    isRead: true,
  });
};

const markAllRead = async (userId) => {
  await notificationRepository.updateManyNotifications(userId, {
    isRead: true,
  });

  return {
    success: true,
  };
};

const removeNotification = async (userId, notificationId) => {
  const notification = await notificationRepository.findNotificationById(notificationId);

  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, "Notification not found");
  }

  await notificationRepository.deleteNotification(notificationId);
  return { success: true };
};

module.exports = {
  notify,
  listNotifications,
  markRead,
  markAllRead,
  removeNotification,
};
