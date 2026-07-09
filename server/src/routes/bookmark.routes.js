const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const bookmarkController = require("../controllers/bookmark.controller");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(bookmarkController.listBookmarks));
router.post("/:userId", asyncHandler(bookmarkController.addBookmark));
router.delete("/:userId", asyncHandler(bookmarkController.removeBookmark));

module.exports = router;
