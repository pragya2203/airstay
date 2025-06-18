const Joi = require('joi');

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().min(0).required(),
    image: Joi.object({
      filename: Joi.string().optional(),
      url: Joi.string().uri().allow("", null)
    }).optional(),
    category: Joi.string().valid(
      "Trending", 
      "Rooms", 
      "Iconic Cities", 
      "Castles", 
      "Amazing Pools", 
      "Camping", 
      "Farms", 
      "Arctic"
    ).optional()
  })
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required()
  }).required()
});
