const notificationService = require("../services/notification.service");
const ApiResponse = require("../utils/apiResponse");

const listNotifications = async (req, res) => {
  const result = await notificationService.listNotifications(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Notifications fetched successfully"));
};

const markRead = async (req, res) => {
  const result = await notificationService.markRead(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Notification marked as read"));
};

const markAllRead = async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  res.status(200).json(new ApiResponse(200, result, "All notifications marked as read"));
};

const removeNotification = async (req, res) => {
  const result = await notificationService.removeNotification(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Notification deleted"));
};

const getUnreadCount = async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json(new ApiResponse(200, result, "Unread count fetched"));
};

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
  removeNotification,
  getUnreadCount,
};
