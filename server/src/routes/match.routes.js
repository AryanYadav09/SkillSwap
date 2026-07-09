const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const matchController = require("../controllers/match.controller");
const { sendMatchRequestSchema } = require("../validators/match.validator");

const router = express.Router();

router.use(protect);

router.get("/compatible", asyncHandler(matchController.listCompatibleMatches));
router.get("/", asyncHandler(matchController.listMatchRequests));
router.post("/", validate(sendMatchRequestSchema), asyncHandler(matchController.sendMatchRequest));
router.patch("/:id/accept", asyncHandler(matchController.acceptMatchRequest));
router.patch("/:id/reject", asyncHandler(matchController.rejectMatchRequest));
router.patch("/:id/cancel", asyncHandler(matchController.cancelMatchRequest));
router.patch("/:id/complete", asyncHandler(matchController.completeMatchRequest));

module.exports = router;
