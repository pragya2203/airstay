// controllers/bookingController.js
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.bookingForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("booking/new", {
    listing,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
  });
};

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");
  const { checkIn, checkOut, guests } = req.body.booking;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate >= checkOutDate) {
    req.flash("error", "Check-out date must be after check-in date.");
    return res.redirect(`/listings/${id}`);
  }

  if (checkInDate < today) {
    req.flash("error", "Check-in date cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  const overlapping = await Booking.find({
    listing: listing._id,
    $or: [
      { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
    ],
  });

  if (overlapping.length > 0) {
    req.flash("error", "This listing is already booked for the selected dates.");
    return res.redirect(`/listings/${id}`);
  }

  const days = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
  const totalPrice = Math.max(1, days) * listing.price;

  const booking = new Booking({
    listing: listing._id,
    user: req.user._id,
    owner: listing.owner._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
    totalPrice,
  });

  await booking.save();
  req.flash("success", "Booking Confirmed");
  res.redirect("/bookings");
};

module.exports.userBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });

  // Only keep bookings with existing (non-null) listings
  const validBookings = bookings.filter(booking => booking.listing);

  res.render("booking/myBookings", { bookings: validBookings });
};


module.exports.cancelBooking = async (req, res) => {
  await Booking.findByIdAndDelete(req.params.bookingId);
  req.flash("success", "Booking cancelled successfully.");
  res.redirect("/bookings");
};

module.exports.ownerDashboard = async (req, res) => {
  const bookings = await Booking.find({ owner: req.user._id })
    .populate("listing user");

  // Filter out bookings where listing is null (deleted listing)
  const validBookings = bookings.filter(booking => booking.listing);

  res.render("booking/ownerDashboard", { bookings: validBookings });
};


module.exports.checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.body;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ available: false, message: "Invalid dates provided." });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const overlapping = await Booking.findOne({
    listing: id,
    $or: [
      { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
    ],
  });

  if (overlapping) {
    return res.json({
      available: false,
      message: "Selected dates are already booked. Please choose different dates.",
    });
  }

  return res.json({ available: true });
};
