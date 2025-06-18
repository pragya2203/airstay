const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapToken = 'pk.eyJ1IjoicHJhZ3lhMjIwMyIsImEiOiJjbWMwZGRndDQwMTdpMmtzNjZ4bHR4dXMwIn0.M5oaydQyef4WpfuRq6aWkA'
const geocodingClient = mbxGeocoding({accessToken: mapToken})
const { cloudinary } = require("../CloudConfig.js");


module.exports.index = async (req, res) => {
  const listings = await Listing.find({});
  res.render("listings/index", { listings });
};

module.exports.search = async (req, res) => {
  const { q } = req.query;

  let listings = [];
  if (q && q.trim()) {
    const regex = new RegExp(q, 'i');
    listings = await Listing.find({
      $or: [
        { title: regex },
        { location: regex },
        {country:regex},
        { description: regex }
      ]
    });
  }
  res.render('listings/results', { listings, q });
}    

// controllers/listings.js

module.exports.categoryListings = async (req, res) => {
  const { category } = req.params;
  const listings = await Listing.find({ category });
  if (listings.length === 0) {
    req.flash("error", `No listings found in category: ${category}`);
    return res.redirect("/listings");
  }
  res.render("listings/category", { listings, category });
};


module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send(); 
  let url = req.file.path;
  let filename = req.file.filename; 
  let listing = req.body.listing;
  let newListing = new Listing(listing);
  newListing.owner = req.user._id;
  newListing.image = {url, filename};
  newListing.geometry = response.body.features[0].geometry;
  let saveListing = await newListing.save();
  console.log(saveListing)
  req.flash("success", "New Listing Created");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let list = await Listing.findById(id);
  if (!list) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/edit", { list });
};

module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) {
    throw new ExpressError(400, "Send valid data");
  }

  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Update text fields
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;
  listing.category = req.body.listing.category || listing.category;

  // Update coordinates if location changed
  const geoData = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  }).send();
  listing.geometry = geoData.body.features[0].geometry;

  // Update image only if a new one was uploaded
  if (req.file) {
    await cloudinary.uploader.destroy(listing.image.filename); // optional
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};



module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let list = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!list) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show", { list, mapboxToken: process.env.MAPBOX_TOKEN });
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};
