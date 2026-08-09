const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const sessionController = require("../controllers/session.controller");
const { createSessionSchema, updateSessionSchema } = require("../validators/session.validator");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(sessionController.listSessions));
router.get("/meeting/:meetingId", asyncHandler(sessionController.getByMeetingId));
router.get("/:id", asyncHandler(sessionController.getSessionById));
router.post("/", validate(createSessionSchema), asyncHandler(sessionController.createSession));
router.patch("/:id", validate(updateSessionSchema), asyncHandler(sessionController.updateSession));
router.patch("/:id/cancel", asyncHandler(sessionController.cancelSession));
router.patch("/:id/complete", asyncHandler(sessionController.completeSession));
router.patch("/:id/accept", asyncHandler(sessionController.acceptSession));
router.patch("/:id/reject", asyncHandler(sessionController.rejectSession));

module.exports = router;
