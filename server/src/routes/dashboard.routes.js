const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(dashboardController.getDashboard));

module.exports = router;
