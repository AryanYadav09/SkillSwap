const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const availabilityController = require("../controllers/availability.controller");
const { createAvailabilitySchema, updateAvailabilitySchema } = require("../validators/availability.validator");

const router = express.Router();

router.use(protect);

router.post("/", validate(createAvailabilitySchema), asyncHandler(availabilityController.createAvailability));
router.get("/me", asyncHandler(availabilityController.getMyAvailability));
router.get("/user/:userId", asyncHandler(availabilityController.getUserAvailability));
router.put("/:id", validate(updateAvailabilitySchema), asyncHandler(availabilityController.updateAvailability));
router.delete("/:id", asyncHandler(availabilityController.deleteAvailability));
router.patch("/:id/toggle", asyncHandler(availabilityController.toggleAvailability));

module.exports = router;
