const { z } = require("zod");

const { SKILL_LEVELS } = require("../constants/enums");

const createLearningSkillSchema = z.object({
  name: z.string().min(2).max(80),
  category: z.string().min(2).max(60),
  description: z.string().min(10).max(1000),
  goal: z.string().min(10).max(1000),
  currentLevel: z.enum(SKILL_LEVELS),
});

const updateLearningSkillSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    category: z.string().min(2).max(60).optional(),
    description: z.string().min(10).max(1000).optional(),
    goal: z.string().min(10).max(1000).optional(),
    currentLevel: z.enum(SKILL_LEVELS).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one learning skill field must be provided",
  });

module.exports = {
  createLearningSkillSchema,
  updateLearningSkillSchema,
};
