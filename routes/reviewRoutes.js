const express = require('express');
const reviewConstroller = require('../controllers/reviewController');
const authConstroller = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(reviewConstroller.getAllReviews)
  .post(
    authConstroller.protect,
    authConstroller.restrictTo('user'),
    reviewConstroller.createReview
  );

module.exports = router;
