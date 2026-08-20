const prisma = require("../config/db");
const availabilityRepository = require("../repositories/availability.repository");
const bookingRepository = require("../repositories/booking.repository");

const DAY_MAP = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/**
 * Convert a local time string ("HH:mm") on a specific date in a given timezone to a UTC Date.
 */
const localTimeToUTC = (dateStr, timeStr, timezone) => {
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Create a date string in the target timezone
  const year = dateStr.getFullYear();
  const month = String(dateStr.getMonth() + 1).padStart(2, "0");
  const day = String(dateStr.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");

  // Use Intl to get the offset for this timezone at this date/time
  const localDateStr = `${year}-${month}-${day}T${h}:${m}:00`;

  // Create date assuming UTC first
  const utcDate = new Date(`${localDateStr}Z`);

  // Get the timezone offset by comparing formatted dates
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Find the offset between the timezone and UTC
  const parts = formatter.formatToParts(utcDate);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const tzYear = Number(getPart("year"));
  const tzMonth = Number(getPart("month"));
  const tzDay = Number(getPart("day"));
  const tzHour = Number(getPart("hour") === "24" ? "0" : getPart("hour"));
  const tzMinute = Number(getPart("minute"));

  const tzDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0));
  const offsetMs = tzDate.getTime() - utcDate.getTime();

  // The actual UTC time is: local time - offset
  const actualLocalDate = new Date(`${localDateStr}Z`);
  return new Date(actualLocalDate.getTime() - offsetMs);
};

/**
 * Convert a UTC date to a specific timezone and return a formatted object.
 */
const utcToTimezone = (utcDate, timezone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    weekday: "long",
  });

  return formatter.format(utcDate);
};

/**
 * Generate available time slots for a user for the next N days.
 * Slots are returned in the viewer's timezone.
 */
const getAvailableSlots = async (userId, viewerTimezone, daysAhead = 14) => {
  // 1. Get user's active availability windows
  const availabilities = await availabilityRepository.findActiveByUserId(userId);

  if (!availabilities.length) {
    return [];
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // 2. Get already booked slots for these availabilities
  const availabilityIds = availabilities.map((a) => a.id);
  const bookedSlots = await bookingRepository.findBookedSlotsByAvailabilityIds(
    availabilityIds,
    now,
    endDate,
  );

  const bookedSet = new Set(
    bookedSlots.map((s) => `${s.availabilityId}:${s.startTime.toISOString()}`),
  );

  // 3. Generate concrete slots for each day
  const slots = [];
  const currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);

  for (let d = 0; d < daysAhead; d++) {
    const checkDate = new Date(currentDate.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = Object.keys(DAY_MAP).find(
      (key) => DAY_MAP[key] === checkDate.getDay(),
    );

    for (const avail of availabilities) {
      // Check if this availability applies to this date
      if (avail.isRecurring) {
        if (avail.dayOfWeek !== dayOfWeek) continue;
      } else {
        // One-time availability — check specific date
        if (!avail.specificDate) continue;
        const specificDate = new Date(avail.specificDate);
        if (
          specificDate.getFullYear() !== checkDate.getFullYear() ||
          specificDate.getMonth() !== checkDate.getMonth() ||
          specificDate.getDate() !== checkDate.getDate()
        ) {
          continue;
        }
      }

      // Generate time slots within this window
      const [startH, startM] = avail.startTime.split(":").map(Number);
      const [endH, endM] = avail.endTime.split(":").map(Number);
      const windowStartMinutes = startH * 60 + startM;
      const windowEndMinutes = endH * 60 + endM;
      const slotDuration = avail.meetingDuration;
      const buffer = avail.bufferMinutes;

      let currentMinute = windowStartMinutes;

      while (currentMinute + slotDuration <= windowEndMinutes) {
        const slotStartUTC = localTimeToUTC(checkDate, `${String(Math.floor(currentMinute / 60)).padStart(2, "0")}:${String(currentMinute % 60).padStart(2, "0")}`, avail.timezone);
        const slotEndUTC = new Date(slotStartUTC.getTime() + slotDuration * 60 * 1000);

        // Skip if slot is in the past (with 5 min buffer)
        if (slotStartUTC.getTime() <= now.getTime() + 5 * 60 * 1000) {
          currentMinute += slotDuration + buffer;
          continue;
        }

        const bookedKey = `${avail.id}:${slotStartUTC.toISOString()}`;
        const isBooked = bookedSet.has(bookedKey);

        if (!isBooked) {
          // Check if a matching BookingSlot exists in the DB, or create one on-the-fly reference
          // We generate slot info for display — actual BookingSlot records are created when needed
          const slotStartFormatted = utcToTimezone(slotStartUTC, viewerTimezone);
          const slotEndFormatted = utcToTimezone(slotEndUTC, viewerTimezone);

          slots.push({
            availabilityId: avail.id,
            startTimeUTC: slotStartUTC.toISOString(),
            endTimeUTC: slotEndUTC.toISOString(),
            startTimeLocal: slotStartFormatted,
            endTimeLocal: slotEndFormatted,
            duration: slotDuration,
            hostTimezone: avail.timezone,
            viewerTimezone,
            hostName: avail.user?.name,
            hostId: avail.userId,
          });
        }

        currentMinute += slotDuration + buffer;
      }
    }
  }

  // Sort by start time
  slots.sort((a, b) => new Date(a.startTimeUTC) - new Date(b.startTimeUTC));

  // Group by date (in viewer's timezone)
  const grouped = {};
  for (const slot of slots) {
    const dateKey = new Intl.DateTimeFormat("en-US", {
      timeZone: viewerTimezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(slot.startTimeUTC));

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        dateISO: new Date(slot.startTimeUTC).toISOString().split("T")[0],
        slots: [],
      };
    }

    grouped[dateKey].slots.push(slot);
  }

  return Object.values(grouped);
};

module.exports = {
  getAvailableSlots,
  localTimeToUTC,
  utcToTimezone,
};
