const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const reviewController = require("../controllers/review.controller");
const { createReviewSchema } = require("../validators/review.validator");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(reviewController.listReviews));
router.post("/", validate(createReviewSchema), asyncHandler(reviewController.createReview));

module.exports = router;
