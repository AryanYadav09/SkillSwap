const { z } = require("zod");

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(1000).optional(),
  college: z.string().min(2).max(120).optional(),
  department: z.string().min(2).max(120).optional(),
  semester: z.string().min(1).max(20).optional(),
});

module.exports = {
  updateProfileSchema,
};
