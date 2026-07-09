const { z } = require("zod");

const sendMatchRequestSchema = z.object({
  receiverId: z.string().min(10),
  message: z.string().max(500).optional(),
});

module.exports = {
  sendMatchRequestSchema,
};
