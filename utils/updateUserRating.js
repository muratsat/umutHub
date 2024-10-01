const User = require('../models/user.model');

async function updateUserRating(userId, points) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { rating: points } },
      { new: true }
    );
    return updatedUser;
  } catch (error) {
    console.error('Error updating user rating:', error);
    throw error;
  }
}

module.exports = updateUserRating;