const reviewService = require("../services/review.service");
const ApiResponse = require("../utils/apiResponse");

const listReviews = async (req, res) => {
  const result = await reviewService.listReviews(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, "Reviews fetched successfully"));
};

const createReview = async (req, res) => {
  const result = await reviewService.createReview(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, "Review added successfully"));
};

module.exports = {
  listReviews,
  createReview,
};
