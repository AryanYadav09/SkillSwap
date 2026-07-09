const { z } = require("zod");

const createMessageSchema = z.object({
  chatId: z.string().min(10),
  message: z.string().max(2000).optional(),
});

module.exports = {
  createMessageSchema,
};
