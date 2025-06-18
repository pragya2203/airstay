if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
console.log("SECRET from env:", process.env.SECRET);

// Basic Imports
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); // For layouts and boilerplate reuse in EJS
const ExpressError = require("./utils/ExpressError.js"); // Custom error handler
const session = require("express-session"); // Session middleware
const MongoStore = require('connect-mongo');
const flash = require("connect-flash"); // Flash messages for success/error alerts
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js"); // Mongoose User model
const multer = require('multer');
const { storage } = require('./cloudConfig');
const upload = multer({ storage });


// Route imports
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");

const app = express();
//const MONGO_URL = "mongodb://127.0.0.1:27017/airstay";
const dbUrl = process.env.ATLASDB_URL;

// Connect to MongoDB using async/await
async function main() {
  await mongoose.connect(dbUrl);
  console.log("Connected to DB");
}
main().catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Set EJS as view engine and configure views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

// Enable method override for PUT/DELETE in HTML forms
app.use(methodOverride("_method"));

// Use ejs-mate for layout support in EJS templates
app.engine("ejs", ejsMate);

// Serve static files (CSS, JS, images) from /public directory
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto:{
    secret: process.env.SECRET,
  },
  touchAfter: 24*3600,
})

store.on("error",()=>{
  console.log("ERROR in MONGO SESSION STORE",err)
})

// Session configuration
const sessionOptions = {
  store,
  secret: process.env.SECRET, // Used to sign session ID cookie
  resave: false,
  saveUninitialized: true,
  cookie: {
    expire: Date.now() + 7 * 24 * 60 * 60 * 1000, // Cookie expiry: 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // Prevents client-side JS from accessing the cookie
  }
};

app.use(session(sessionOptions)); // Apply session middleware
app.use(flash()); // Enable flash messaging

// Passport setup (for authentication)
app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Use passport with sessions

// Use LocalStrategy and authenticate using passport-local-mongoose's built-in method
passport.use(new LocalStrategy(User.authenticate()));

// How to store user in session
passport.serializeUser(User.serializeUser());
// How to retrieve user from session
passport.deserializeUser(User.deserializeUser());

// Middleware to pass flash messages and current user info to all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Mounting route modules
app.use("/listings", listingRouter); // All routes related to listings
app.use("/listings/:id/reviews", reviewRouter); // All routes related to reviews
app.use("/", userRouter); // All routes related to users (signup/login/logout)

// Booking form and creation (for specific listing)
app.use("/listings/:id/bookings", bookingRoutes);

// My Bookings page (all bookings of logged-in user)
app.use("/bookings", bookingRoutes);

app.use("/payment", paymentRoutes);

// Optional 404 error handler for undefined routes (currently commented out)
// app.all("*", (req, res, next) => {
//   next(new ExpressError(404, "Page Not Found!"));
// });

// Generic error handler middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
});

// Start the server
app.listen(8080, () => {
  console.log(`Server is listening on port 8080`);
});
