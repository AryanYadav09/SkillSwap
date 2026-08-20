const { z } = require("zod");

const bookSlotSchema = z.object({
  slotId: z.string().min(1, "Slot ID is required"),
  title: z.string().min(2).max(120).default("Skill Exchange Session"),
});

const cancelMeetingSchema = z.object({
  reason: z.string().max(500).optional(),
});

const rescheduleMeetingSchema = z.object({
  newSlotId: z.string().min(1, "New slot ID is required"),
});

module.exports = {
  bookSlotSchema,
  cancelMeetingSchema,
  rescheduleMeetingSchema,
};
