const { z } = require("zod");

const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BANNED"]),
});

module.exports = {
  updateUserStatusSchema,
};
