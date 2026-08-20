const bookingService = require("../services/booking.service");
const ApiResponse = require("../utils/apiResponse");

const bookSlot = async (req, res) => {
  // Support both direct slot booking and generated slot booking
  const { slotId, availabilityId, startTimeUTC, endTimeUTC, title } = req.body;

  let result;
  if (slotId) {
    result = await bookingService.bookSlot(req.user.id, { slotId, title });
  } else if (availabilityId && startTimeUTC && endTimeUTC) {
    result = await bookingService.bookGeneratedSlot(req.user.id, {
      availabilityId,
      startTimeUTC,
      endTimeUTC,
      title,
    });
  } else {
    return res.status(400).json(new ApiResponse(400, null, "Either slotId or (availabilityId + startTimeUTC + endTimeUTC) is required"));
  }

  res.status(201).json(new ApiResponse(201, result, "Meeting booked successfully"));
};

const listMeetings = async (req, res) => {
  const result = await bookingService.listMeetings(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Meetings fetched successfully"));
};

const getMeeting = async (req, res) => {
  const result = await bookingService.getMeetingById(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Meeting fetched successfully"));
};

const cancelMeeting = async (req, res) => {
  const result = await bookingService.cancelMeeting(req.user.id, req.params.id, req.body?.reason);
  res.status(200).json(new ApiResponse(200, result, "Meeting cancelled successfully"));
};

const rescheduleMeeting = async (req, res) => {
  const result = await bookingService.rescheduleMeeting(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Meeting rescheduled successfully"));
};

const joinMeeting = async (req, res) => {
  const result = await bookingService.joinMeeting(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Meeting join authorized"));
};

const getMeetingByToken = async (req, res) => {
  const result = await bookingService.getMeetingByToken(req.user.id, req.params.token);
  res.status(200).json(new ApiResponse(200, result, "Meeting fetched successfully"));
};

module.exports = {
  bookSlot,
  listMeetings,
  getMeeting,
  cancelMeeting,
  rescheduleMeeting,
  joinMeeting,
  getMeetingByToken,
};
