// routes/listings.js
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer')
const {storage} = require("../CloudConfig.js")
const upload = multer({ storage })
const Listing = require("../models/listing.js");



router
  .route("/")
  .get( wrapAsync(listingController.index))
  .post( 
    isLoggedIn,  
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  )


router.get('/search', listingController.search);

router.get("/category/:category", wrapAsync(listingController.categoryListings));

// New
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .put(
  isLoggedIn,
  upload.single('listing[image]'),
  isOwner,
  validateListing,
  wrapAsync(listingController.updateListing))
  .get(wrapAsync(listingController.showListing))
  .delete( 
    isLoggedIn, 
    isOwner, 
    wrapAsync(listingController.destroyListing));


// Edit
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));


module.exports = router;
