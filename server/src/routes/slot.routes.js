const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const slotController = require("../controllers/slot.controller");

const router = express.Router();

router.use(protect);

router.get("/:userId/available-slots", asyncHandler(slotController.getAvailableSlots));

module.exports = router;
