const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const learningSkillController = require("../controllers/learning-skill.controller");
const {
  createLearningSkillSchema,
  updateLearningSkillSchema,
} = require("../validators/learning-skill.validator");

const router = express.Router();

router.get("/", asyncHandler(learningSkillController.listLearningSkills));
router.get("/:id", asyncHandler(learningSkillController.getLearningSkillById));
router.post(
  "/",
  protect,
  validate(createLearningSkillSchema),
  asyncHandler(learningSkillController.createLearningSkill),
);
router.patch(
  "/:id",
  protect,
  validate(updateLearningSkillSchema),
  asyncHandler(learningSkillController.updateLearningSkill),
);
router.delete("/:id", protect, asyncHandler(learningSkillController.deleteLearningSkill));

module.exports = router;
