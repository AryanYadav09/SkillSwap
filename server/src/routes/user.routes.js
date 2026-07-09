const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validate.middleware");
const userController = require("../controllers/user.controller");
const { updateProfileSchema } = require("../validators/user.validator");

const router = express.Router();

router.get("/", asyncHandler(userController.listUsers));
router.patch(
  "/me/profile",
  protect,
  upload.single("profileImage"),
  validate(updateProfileSchema),
  asyncHandler(userController.updateProfile),
);
router.get("/:id", asyncHandler(userController.getUserById));

module.exports = router;
