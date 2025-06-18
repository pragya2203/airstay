const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/bookings");

router.get("/new", isLoggedIn, bookingController.bookingForm);
router.post("/", isLoggedIn, bookingController.createBooking);
router.get("/", isLoggedIn, bookingController.userBookings);
router.delete("/:bookingId", isLoggedIn, bookingController.cancelBooking);
router.get("/owner/dashboard", isLoggedIn, bookingController.ownerDashboard);
router.post("/check-availability", bookingController.checkAvailability);

module.exports = router;