const { z } = require("zod");

const { REPORT_REASONS } = require("../constants/enums");

const createReportSchema = z.object({
  reportedUserId: z.string().min(10),
  reason: z.enum(REPORT_REASONS),
  description: z.string().min(10).max(1000),
});

const updateReportStatusSchema = z.object({
  status: z.enum(["RESOLVED", "REJECTED"]),
  adminNotes: z.string().max(1000).optional(),
});

module.exports = {
  createReportSchema,
  updateReportStatusSchema,
};
