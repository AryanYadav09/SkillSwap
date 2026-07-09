const { z } = require("zod");

const { SKILL_LEVELS } = require("../constants/enums");

const skillPayload = {
  name: z.string().min(2).max(80),
  category: z.string().min(2).max(60),
  description: z.string().min(10).max(1000),
  level: z.enum(SKILL_LEVELS),
};

const createSkillSchema = z.object(skillPayload);

const updateSkillSchema = z
  .object({
    name: skillPayload.name.optional(),
    category: skillPayload.category.optional(),
    description: skillPayload.description.optional(),
    level: skillPayload.level.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one skill field must be provided",
  });

module.exports = {
  createSkillSchema,
  updateSkillSchema,
};
