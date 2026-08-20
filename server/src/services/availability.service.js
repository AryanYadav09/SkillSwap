const ApiError = require("../utils/apiError");
const availabilityRepository = require("../repositories/availability.repository");

const createAvailability = async (userId, payload) => {
  // Check for overlapping availability on the same day
  const overlapping = await availabilityRepository.findOverlapping({
    userId,
    dayOfWeek: payload.dayOfWeek,
    startTime: payload.startTime,
    endTime: payload.endTime,
  });

  if (overlapping.length > 0) {
    throw new ApiError(409, "You already have availability that overlaps with this time window");
  }

  // Validate that the window is long enough for at least one meeting slot
  const [startH, startM] = payload.startTime.split(":").map(Number);
  const [endH, endM] = payload.endTime.split(":").map(Number);
  const windowMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const duration = payload.meetingDuration || 30;

  if (windowMinutes < duration) {
    throw new ApiError(400, `Availability window must be at least ${duration} minutes to fit one meeting slot`);
  }

  return availabilityRepository.create({
    userId,
    dayOfWeek: payload.dayOfWeek,
    startTime: payload.startTime,
    endTime: payload.endTime,
    timezone: payload.timezone,
    isRecurring: payload.isRecurring ?? true,
    specificDate: payload.specificDate || null,
    meetingDuration: duration,
    bufferMinutes: payload.bufferMinutes ?? 5,
  });
};

const getMyAvailability = async (userId) => {
  return availabilityRepository.findByUserId(userId);
};

const getUserAvailability = async (userId) => {
  return availabilityRepository.findActiveByUserId(userId);
};

const updateAvailability = async (userId, availabilityId, payload) => {
  const existing = await availabilityRepository.findById(availabilityId);

  if (!existing) {
    throw new ApiError(404, "Availability not found");
  }

  if (existing.userId !== userId) {
    throw new ApiError(403, "You can only update your own availability");
  }

  // If changing time/day, check for overlaps
  if (payload.dayOfWeek || payload.startTime || payload.endTime) {
    const dayOfWeek = payload.dayOfWeek || existing.dayOfWeek;
    const startTime = payload.startTime || existing.startTime;
    const endTime = payload.endTime || existing.endTime;

    const overlapping = await availabilityRepository.findOverlapping({
      userId,
      dayOfWeek,
      startTime,
      endTime,
      excludeId: availabilityId,
    });

    if (overlapping.length > 0) {
      throw new ApiError(409, "This change would overlap with existing availability");
    }
  }

  return availabilityRepository.update(availabilityId, payload);
};

const deleteAvailability = async (userId, availabilityId) => {
  const existing = await availabilityRepository.findById(availabilityId);

  if (!existing) {
    throw new ApiError(404, "Availability not found");
  }

  if (existing.userId !== userId) {
    throw new ApiError(403, "You can only delete your own availability");
  }

  await availabilityRepository.remove(availabilityId);
  return { success: true };
};

const toggleAvailability = async (userId, availabilityId) => {
  const existing = await availabilityRepository.findById(availabilityId);

  if (!existing) {
    throw new ApiError(404, "Availability not found");
  }

  if (existing.userId !== userId) {
    throw new ApiError(403, "You can only toggle your own availability");
  }

  return availabilityRepository.update(availabilityId, {
    isActive: !existing.isActive,
  });
};

module.exports = {
  createAvailability,
  getMyAvailability,
  getUserAvailability,
  updateAvailability,
  deleteAvailability,
  toggleAvailability,
};
