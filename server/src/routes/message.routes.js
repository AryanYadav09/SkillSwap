const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validate.middleware");
const messageController = require("../controllers/message.controller");
const { createMessageSchema } = require("../validators/message.validator");

const router = express.Router();

router.use(protect);

router.get("/:chatId", asyncHandler(messageController.getMessages));
router.post(
  "/",
  upload.single("image"),
  validate(createMessageSchema),
  asyncHandler(messageController.createMessage),
);
router.patch("/:chatId/seen", asyncHandler(messageController.markSeen));

module.exports = router;
