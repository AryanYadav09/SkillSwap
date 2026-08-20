const prisma = require("../config/db");

const meetingInclude = {
  hostUser: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
  guestUser: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
    },
  },
  bookingSlot: {
    include: {
      availability: {
        select: {
          id: true,
          dayOfWeek: true,
          meetingDuration: true,
          timezone: true,
        },
      },
    },
  },
};

const findSlotById = (id) =>
  prisma.bookingSlot.findUnique({
    where: { id },
    include: {
      availability: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      },
      bookedBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      meeting: true,
    },
  });

const findAvailableSlotById = (id) =>
  prisma.bookingSlot.findFirst({
    where: { id, status: "AVAILABLE" },
    include: {
      availability: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

const createSlot = (data) =>
  prisma.bookingSlot.create({ data });

const updateSlot = (id, data) =>
  prisma.bookingSlot.update({
    where: { id },
    data,
  });

const findBookedSlotsByAvailabilityIds = (availabilityIds, startDate, endDate) =>
  prisma.bookingSlot.findMany({
    where: {
      availabilityId: { in: availabilityIds },
      status: "BOOKED",
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    },
  });

const bookSlotAtomically = async ({ slotId, bookedById, meetingData }) =>
  prisma.$transaction(async (tx) => {
    // 1. Lock and verify the slot is still available
    const slot = await tx.bookingSlot.findFirst({
      where: { id: slotId, status: "AVAILABLE" },
      include: {
        availability: {
          include: {
            user: {
              select: { id: true, name: true, username: true, profileImage: true },
            },
          },
        },
      },
    });

    if (!slot) {
      return { success: false, error: "SLOT_UNAVAILABLE" };
    }

    // 2. Create the meeting
    const meeting = await tx.meeting.create({
      data: meetingData,
      include: meetingInclude,
    });

    // 3. Mark slot as booked
    await tx.bookingSlot.update({
      where: { id: slotId },
      data: {
        status: "BOOKED",
        bookedById,
        meetingId: meeting.id,
      },
    });

    return { success: true, meeting, slot };
  });

const cancelMeetingAtomically = async ({ meetingId, cancelledById, cancelReason }) =>
  prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      include: { bookingSlot: true },
    });

    if (!meeting) {
      return { success: false, error: "MEETING_NOT_FOUND" };
    }

    if (meeting.status === "CANCELLED") {
      return { success: false, error: "ALREADY_CANCELLED" };
    }

    if (meeting.status === "COMPLETED") {
      return { success: false, error: "ALREADY_COMPLETED" };
    }

    // Update meeting status
    const updatedMeeting = await tx.meeting.update({
      where: { id: meetingId },
      data: {
        status: "CANCELLED",
        cancelledById,
        cancelReason,
      },
      include: meetingInclude,
    });

    // Release the slot back to available
    if (meeting.bookingSlot) {
      await tx.bookingSlot.update({
        where: { id: meeting.bookingSlot.id },
        data: {
          status: "AVAILABLE",
          bookedById: null,
          meetingId: null,
        },
      });
    }

    return { success: true, meeting: updatedMeeting };
  });

const rescheduleMeetingAtomically = async ({ meetingId, newSlotId, bookedById, newMeetingData }) =>
  prisma.$transaction(async (tx) => {
    // 1. Get the existing meeting
    const oldMeeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      include: { bookingSlot: true },
    });

    if (!oldMeeting) {
      return { success: false, error: "MEETING_NOT_FOUND" };
    }

    if (oldMeeting.status !== "SCHEDULED") {
      return { success: false, error: "CANNOT_RESCHEDULE" };
    }

    // 2. Verify new slot is available
    const newSlot = await tx.bookingSlot.findFirst({
      where: { id: newSlotId, status: "AVAILABLE" },
      include: {
        availability: {
          include: {
            user: {
              select: { id: true, name: true, username: true, profileImage: true },
            },
          },
        },
      },
    });

    if (!newSlot) {
      return { success: false, error: "NEW_SLOT_UNAVAILABLE" };
    }

    // 3. Cancel old meeting
    await tx.meeting.update({
      where: { id: meetingId },
      data: { status: "CANCELLED", cancelReason: "Rescheduled" },
    });

    // 4. Release old slot
    if (oldMeeting.bookingSlot) {
      await tx.bookingSlot.update({
        where: { id: oldMeeting.bookingSlot.id },
        data: { status: "AVAILABLE", bookedById: null, meetingId: null },
      });
    }

    // 5. Create new meeting
    const newMeeting = await tx.meeting.create({
      data: newMeetingData,
      include: meetingInclude,
    });

    // 6. Mark new slot as booked
    await tx.bookingSlot.update({
      where: { id: newSlotId },
      data: { status: "BOOKED", bookedById, meetingId: newMeeting.id },
    });

    return { success: true, meeting: newMeeting, oldMeeting };
  });

const findMeetingById = (id) =>
  prisma.meeting.findUnique({
    where: { id },
    include: meetingInclude,
  });

const findMeetingByToken = (meetingToken) =>
  prisma.meeting.findUnique({
    where: { meetingToken },
    include: meetingInclude,
  });

const listUserMeetings = ({ userId, status, skip, take }) =>
  prisma.meeting.findMany({
    where: {
      OR: [{ hostUserId: userId }, { guestUserId: userId }],
      ...(status ? { status } : {}),
    },
    orderBy: { startTime: "desc" },
    skip,
    take,
    include: meetingInclude,
  });

const countUserMeetings = ({ userId, status }) =>
  prisma.meeting.count({
    where: {
      OR: [{ hostUserId: userId }, { guestUserId: userId }],
      ...(status ? { status } : {}),
    },
  });

const findUpcomingMeetings = (userId, limit = 5) =>
  prisma.meeting.findMany({
    where: {
      OR: [{ hostUserId: userId }, { guestUserId: userId }],
      status: "SCHEDULED",
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
    take: limit,
    include: meetingInclude,
  });

module.exports = {
  findSlotById,
  findAvailableSlotById,
  createSlot,
  updateSlot,
  findBookedSlotsByAvailabilityIds,
  bookSlotAtomically,
  cancelMeetingAtomically,
  rescheduleMeetingAtomically,
  findMeetingById,
  findMeetingByToken,
  listUserMeetings,
  countUserMeetings,
  findUpcomingMeetings,
};
