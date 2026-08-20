const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const bookingController = require("../controllers/booking.controller");
const { cancelMeetingSchema, rescheduleMeetingSchema } = require("../validators/booking.validator");

const router = express.Router();

router.use(protect);

router.post("/", asyncHandler(bookingController.bookSlot));
router.get("/", asyncHandler(bookingController.listMeetings));
router.get("/token/:token", asyncHandler(bookingController.getMeetingByToken));
router.get("/:id", asyncHandler(bookingController.getMeeting));
router.post("/:id/cancel", validate(cancelMeetingSchema), asyncHandler(bookingController.cancelMeeting));
router.post("/:id/reschedule", validate(rescheduleMeetingSchema), asyncHandler(bookingController.rescheduleMeeting));
router.get("/:id/join", asyncHandler(bookingController.joinMeeting));

module.exports = router;
