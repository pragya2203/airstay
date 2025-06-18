// controllers/reviews.js
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
  const list = await Listing.findById(req.params.id);
  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  list.reviews.push(newReview);

  await newReview.save();
  await list.save();

  req.flash("success", "New Review Created");
  res.redirect(`/listings/${req.params.id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

  const review = await Review.findById(reviewId);
  if (review) {
    await review.deleteOne();
  }

  req.flash("success", "Review Deleted");
  res.redirect(`/listings/${id}`);
};
