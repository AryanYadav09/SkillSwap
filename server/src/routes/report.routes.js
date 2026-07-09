const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const reportController = require("../controllers/report.controller");
const { createReportSchema } = require("../validators/report.validator");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(reportController.listReports));
router.post("/", validate(createReportSchema), asyncHandler(reportController.createReport));

module.exports = router;
