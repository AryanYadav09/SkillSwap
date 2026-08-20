const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, parsePagination } = require("../utils/query");
const bookingRepository = require("../repositories/booking.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../constants/enums");

const bookSlot = async (userId, payload) => {
  const { slotId, title } = payload;

  // Find the slot and ensure it belongs to another user
  const slot = await bookingRepository.findAvailableSlotById(slotId);

  if (!slot) {
    // Slot might have been booked by someone else, or the slotId is a
    // generated reference. In that case, we need to create the BookingSlot first.
    throw new ApiError(409, "This slot is no longer available. It may have been booked by another user.");
  }

  const hostUserId = slot.availability.userId;

  if (hostUserId === userId) {
    throw new ApiError(400, "You cannot book your own availability slot");
  }

  // Ensure the slot is in the future
  if (new Date(slot.startTime) <= new Date()) {
    throw new ApiError(400, "Cannot book a slot that has already passed");
  }

  const meetingData = {
    hostUserId,
    guestUserId: userId,
    bookingSlotId: slotId,
    title: title || "Skill Exchange Session",
    startTime: slot.startTime,
    endTime: slot.endTime,
    timezone: slot.availability.timezone,
    status: "SCHEDULED",
  };

  const result = await bookingRepository.bookSlotAtomically({
    slotId,
    bookedById: userId,
    meetingData,
  });

  if (!result.success) {
    if (result.error === "SLOT_UNAVAILABLE") {
      throw new ApiError(409, "This slot was just booked by another user. Please select a different time.");
    }
    throw new ApiError(500, "Failed to create booking");
  }

  // Notify the host
  await notificationService.notify({
    userId: hostUserId,
    title: "New session booked",
    message: `${result.meeting.guestUser.name} booked a session with you on ${new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: slot.availability.timezone }).format(new Date(slot.startTime))}.`,
    type: NOTIFICATION_TYPES.MEETING_BOOKED,
    entityId: result.meeting.id,
  });

  // Notify the guest (confirmation)
  await notificationService.notify({
    userId,
    title: "Session confirmed",
    message: `Your session with ${result.meeting.hostUser.name} is confirmed for ${new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: slot.availability.timezone }).format(new Date(slot.startTime))}.`,
    type: NOTIFICATION_TYPES.MEETING_BOOKED,
    entityId: result.meeting.id,
  });

  return result.meeting;
};

/**
 * Create a BookingSlot record from a generated slot reference.
 * This is called when a user wants to book a slot that exists
 * as an availability window but doesn't have a BookingSlot record yet.
 */
const ensureSlotExists = async (availabilityId, startTimeUTC, endTimeUTC) => {
  const prisma = require("../config/db");

  // Check if a slot already exists
  const existing = await prisma.bookingSlot.findFirst({
    where: {
      availabilityId,
      startTime: new Date(startTimeUTC),
      status: "AVAILABLE",
    },
  });

  if (existing) {
    return existing;
  }

  // Create the slot record
  return prisma.bookingSlot.create({
    data: {
      availabilityId,
      startTime: new Date(startTimeUTC),
      endTime: new Date(endTimeUTC),
      status: "AVAILABLE",
    },
  });
};

const bookGeneratedSlot = async (userId, payload) => {
  const { availabilityId, startTimeUTC, endTimeUTC, title } = payload;

  // Ensure the BookingSlot record exists
  const slot = await ensureSlotExists(availabilityId, startTimeUTC, endTimeUTC);

  // Now book using the standard flow
  return bookSlot(userId, { slotId: slot.id, title });
};

const cancelMeeting = async (userId, meetingId, reason) => {
  const meeting = await bookingRepository.findMeetingById(meetingId);

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Verify user is a participant
  if (meeting.hostUserId !== userId && meeting.guestUserId !== userId) {
    throw new ApiError(403, "You are not a participant of this meeting");
  }

  if (meeting.status !== "SCHEDULED") {
    throw new ApiError(400, `Cannot cancel a meeting that is ${meeting.status.toLowerCase()}`);
  }

  // Check minimum cancellation time (1 hour before)
  const oneHourBefore = new Date(meeting.startTime.getTime() - 60 * 60 * 1000);
  if (new Date() > oneHourBefore) {
    throw new ApiError(400, "Meetings can only be cancelled at least 1 hour before the start time");
  }

  const result = await bookingRepository.cancelMeetingAtomically({
    meetingId,
    cancelledById: userId,
    cancelReason: reason,
  });

  if (!result.success) {
    throw new ApiError(400, `Cannot cancel: ${result.error}`);
  }

  // Notify the other user
  const otherUserId = meeting.hostUserId === userId ? meeting.guestUserId : meeting.hostUserId;
  const cancellerName = meeting.hostUserId === userId ? meeting.hostUser.name : meeting.guestUser.name;

  await notificationService.notify({
    userId: otherUserId,
    title: "Meeting cancelled",
    message: `${cancellerName} cancelled the session scheduled for ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: meeting.timezone }).format(new Date(meeting.startTime))}.${reason ? ` Reason: ${reason}` : ""}`,
    type: NOTIFICATION_TYPES.MEETING_CANCELLED,
    entityId: meeting.id,
  });

  return result.meeting;
};

const rescheduleMeeting = async (userId, meetingId, payload) => {
  const { newSlotId } = payload;

  const meeting = await bookingRepository.findMeetingById(meetingId);

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Only participants can reschedule
  if (meeting.hostUserId !== userId && meeting.guestUserId !== userId) {
    throw new ApiError(403, "You are not a participant of this meeting");
  }

  if (meeting.status !== "SCHEDULED") {
    throw new ApiError(400, `Cannot reschedule a meeting that is ${meeting.status.toLowerCase()}`);
  }

  // Get new slot details
  const newSlot = await bookingRepository.findAvailableSlotById(newSlotId);
  if (!newSlot) {
    throw new ApiError(409, "The selected time slot is no longer available");
  }

  if (new Date(newSlot.startTime) <= new Date()) {
    throw new ApiError(400, "Cannot reschedule to a slot that has already passed");
  }

  const newMeetingData = {
    hostUserId: meeting.hostUserId,
    guestUserId: meeting.guestUserId,
    bookingSlotId: newSlotId,
    title: meeting.title,
    startTime: newSlot.startTime,
    endTime: newSlot.endTime,
    timezone: newSlot.availability.timezone,
    status: "SCHEDULED",
  };

  const result = await bookingRepository.rescheduleMeetingAtomically({
    meetingId,
    newSlotId,
    bookedById: meeting.guestUserId,
    newMeetingData,
  });

  if (!result.success) {
    if (result.error === "NEW_SLOT_UNAVAILABLE") {
      throw new ApiError(409, "The selected time slot was just booked by another user");
    }
    throw new ApiError(400, `Cannot reschedule: ${result.error}`);
  }

  // Notify both users
  const otherUserId = meeting.hostUserId === userId ? meeting.guestUserId : meeting.hostUserId;
  const reschedulerName = meeting.hostUserId === userId ? meeting.hostUser.name : meeting.guestUser.name;

  await notificationService.notify({
    userId: otherUserId,
    title: "Meeting rescheduled",
    message: `${reschedulerName} rescheduled your session to ${new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: result.meeting.timezone }).format(new Date(result.meeting.startTime))}.`,
    type: NOTIFICATION_TYPES.MEETING_RESCHEDULED,
    entityId: result.meeting.id,
  });

  return result.meeting;
};

const getMeetingById = async (userId, meetingId) => {
  const meeting = await bookingRepository.findMeetingById(meetingId);

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (meeting.hostUserId !== userId && meeting.guestUserId !== userId) {
    throw new ApiError(403, "You are not a participant of this meeting");
  }

  return meeting;
};

const getMeetingByToken = async (userId, meetingToken) => {
  const meeting = await bookingRepository.findMeetingByToken(meetingToken);

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (meeting.hostUserId !== userId && meeting.guestUserId !== userId) {
    throw new ApiError(403, "You are not authorized to join this meeting");
  }

  if (meeting.status === "CANCELLED") {
    throw new ApiError(400, "This meeting has been cancelled");
  }

  return meeting;
};

const listMeetings = async (userId, query) => {
  const pagination = parsePagination(query, ["startTime", "createdAt"], "startTime");
  const status = query.status || undefined;

  const [items, total] = await Promise.all([
    bookingRepository.listUserMeetings({
      userId,
      status,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    bookingRepository.countUserMeetings({ userId, status }),
  ]);

  return buildPaginatedResponse(items, total, pagination);
};

const joinMeeting = async (userId, meetingId) => {
  const meeting = await bookingRepository.findMeetingById(meetingId);

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (meeting.hostUserId !== userId && meeting.guestUserId !== userId) {
    throw new ApiError(403, "You are not authorized to join this meeting");
  }

  if (meeting.status === "CANCELLED") {
    throw new ApiError(400, "This meeting has been cancelled");
  }

  if (meeting.status === "COMPLETED") {
    throw new ApiError(400, "This meeting has already been completed");
  }

  return {
    meetingId: meeting.id,
    meetingToken: meeting.meetingToken,
    hostUserId: meeting.hostUserId,
    guestUserId: meeting.guestUserId,
    hostName: meeting.hostUser.name,
    guestName: meeting.guestUser.name,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    timezone: meeting.timezone,
    status: meeting.status,
  };
};

module.exports = {
  bookSlot,
  bookGeneratedSlot,
  cancelMeeting,
  rescheduleMeeting,
  getMeetingById,
  getMeetingByToken,
  listMeetings,
  joinMeeting,
  ensureSlotExists,
};
