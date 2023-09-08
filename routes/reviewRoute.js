const reviewController = require('./../controllers/reviewController');
const express = require('express');
const authController = require('./../controllers/authController');
const { route } = require('./tourRoute');

// mergeParams: true is needed to get access to tourId in reviewController
const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.isLoggedIn);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)

// router
//     .route('/:id')
//     .get(reviewController.getReview)
//     .patch(
//         authController.restrictTo('user', 'admin'),
//         reviewController.updateReview
//     )
//     .delete(
//         authController.restrictTo('user', 'admin'),
//         reviewController.deleteReview
//     );

module.exports = router;