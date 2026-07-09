const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const chatController = require("../controllers/chat.controller");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(chatController.listChats));
router.get("/:id", asyncHandler(chatController.getChatById));

module.exports = router;
