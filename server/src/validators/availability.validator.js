const { z } = require("zod");

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createAvailabilitySchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  startTime: z.string().regex(timeRegex, "Time must be in HH:mm format"),
  endTime: z.string().regex(timeRegex, "Time must be in HH:mm format"),
  timezone: z.string().min(1, "Timezone is required"),
  isRecurring: z.boolean().default(true),
  specificDate: z.coerce.date().optional(),
  meetingDuration: z.coerce.number().int().min(15).max(120).default(30),
  bufferMinutes: z.coerce.number().int().min(0).max(60).default(5),
}).refine(
  (data) => {
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    return startH * 60 + startM < endH * 60 + endM;
  },
  { message: "End time must be after start time", path: ["endTime"] },
).refine(
  (data) => {
    if (!data.isRecurring && !data.specificDate) {
      return false;
    }
    return true;
  },
  { message: "Specific date is required for one-time availability", path: ["specificDate"] },
);

const updateAvailabilitySchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK).optional(),
  startTime: z.string().regex(timeRegex, "Time must be in HH:mm format").optional(),
  endTime: z.string().regex(timeRegex, "Time must be in HH:mm format").optional(),
  timezone: z.string().min(1).optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
  specificDate: z.coerce.date().optional(),
  meetingDuration: z.coerce.number().int().min(15).max(120).optional(),
  bufferMinutes: z.coerce.number().int().min(0).max(60).optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field must be provided" },
);

module.exports = {
  createAvailabilitySchema,
  updateAvailabilitySchema,
  DAYS_OF_WEEK,
};
