const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate.middleware");
const { protect } = require("../middleware/auth.middleware");
const authController = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post("/logout", protect, asyncHandler(authController.logout));
router.post("/refresh", asyncHandler(authController.refresh));
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
router.get("/me", protect, asyncHandler(authController.me));

module.exports = router;
