const { z } = require("zod");

const { SKILL_LEVELS } = require("../constants/enums");

const registrationSkillSchema = z.object({
  name: z.string().min(2).max(80),
  category: z.string().min(2).max(60),
  description: z.string().min(10).max(1000),
});

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  college: z.string().min(2).max(120),
  department: z.string().min(2).max(120),
  semester: z.string().min(1).max(20),
  offeredSkill: registrationSkillSchema.extend({
    level: z.enum(SKILL_LEVELS),
  }),
  learningSkill: registrationSkillSchema.extend({
    goal: z.string().min(10).max(1000),
    currentLevel: z.enum(SKILL_LEVELS),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(64),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(64),
  newPassword: z.string().min(8).max(64),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
