const { z } = require("zod");

const createSessionSchema = z.object({
  matchRequestId: z.string().min(10),
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(1000),
  sessionDate: z.coerce.date(),
  duration: z.coerce.number().int().positive().max(480),
});

const updateSessionSchema = z
  .object({
    title: z.string().min(2).max(120).optional(),
    description: z.string().min(10).max(1000).optional(),
    sessionDate: z.coerce.date().optional(),
    duration: z.coerce.number().int().positive().max(480).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one session field must be provided",
  });

module.exports = {
  createSessionSchema,
  updateSessionSchema,
};
