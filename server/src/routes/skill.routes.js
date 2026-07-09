const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const skillController = require("../controllers/skill.controller");
const { createSkillSchema, updateSkillSchema } = require("../validators/skill.validator");

const router = express.Router();

router.get("/", asyncHandler(skillController.listSkills));
router.get("/:id", asyncHandler(skillController.getSkillById));
router.post("/", protect, validate(createSkillSchema), asyncHandler(skillController.createSkill));
router.patch("/:id", protect, validate(updateSkillSchema), asyncHandler(skillController.updateSkill));
router.delete("/:id", protect, asyncHandler(skillController.deleteSkill));

module.exports = router;
