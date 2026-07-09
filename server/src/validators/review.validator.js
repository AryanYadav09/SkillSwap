const { z } = require("zod");

const createReviewSchema = z.object({
  sessionId: z.string().min(10),
  reviewedUserId: z.string().min(10),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

module.exports = {
  createReviewSchema,
};
