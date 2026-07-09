const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const adminController = require("../controllers/admin.controller");
const { updateUserStatusSchema } = require("../validators/admin.validator");
const { updateReportStatusSchema } = require("../validators/report.validator");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/dashboard", asyncHandler(adminController.getDashboard));
router.get("/users", asyncHandler(adminController.listUsers));
router.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  asyncHandler(adminController.updateUserStatus),
);
router.delete("/users/:id", asyncHandler(adminController.deleteUser));
router.get("/skills", asyncHandler(adminController.listSkills));
router.delete("/skills/:id", asyncHandler(adminController.deleteSkill));
router.get("/reports", asyncHandler(adminController.listReports));
router.patch(
  "/reports/:id/status",
  validate(updateReportStatusSchema),
  asyncHandler(adminController.updateReportStatus),
);

module.exports = router;
