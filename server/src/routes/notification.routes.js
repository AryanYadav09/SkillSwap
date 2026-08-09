const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(notificationController.listNotifications));
router.get("/unread-count", asyncHandler(notificationController.getUnreadCount));
router.patch("/read-all", asyncHandler(notificationController.markAllRead));
router.patch("/:id/read", asyncHandler(notificationController.markRead));
router.delete("/:id", asyncHandler(notificationController.removeNotification));

module.exports = router;
