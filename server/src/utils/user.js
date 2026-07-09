const getAverageRating = (reviews = []) => {
  if (!reviews.length) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((total / reviews.length).toFixed(1));
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const {
    password,
    refreshToken,
    passwordResetToken,
    passwordResetTokenExpiry,
    reviewsReceived,
    reviewsWritten,
    ...safeUser
  } = user;

  return {
    ...safeUser,
    averageRating: getAverageRating(reviewsReceived || []),
    totalReviews: reviewsReceived?.length || 0,
    reviewsReceived,
    reviewsWritten,
  };
};

module.exports = {
  sanitizeUser,
  getAverageRating,
};
