const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty!'],
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour!'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user!'],
    },
}, {
    // toJSON and toObject are used to make sure that the virtual properties are displayed in the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// This is how we create an index
// This will make sure that a user can only create one review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// This is how we populate the tour and user fields
reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name',
    // }).populate({
    //     path: 'user',
    //     select: 'name photo',
    // });

    // This is how we populate the user field
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // this points to the current model
    // this is a static method
    // This is how we calculate the statistics for the tour
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);
    // console.log(stats);
    // This is how we update the tour with the statistics
    if (stats.length > 0) {
        await this.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        // If there are no reviews, we set the ratingsQuantity and ratingsAverage to 0
        await this.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 0,
        });
    }
};

// This is how we calculate the statistics for the tour
reviewSchema.post('save', function () {
    // this points to the current review
    // this.constructor points to the current model
    // Review.calcAverageRatings(this.tour);
    this.constructor.calcAverageRatings(this.tour);
});

// This is how we calculate the statistics for the tour
// findByIdAndUpdate
// findByIdAndDelete
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//     // this.r points to the current review
    
//     try {
//         this.r = await this.findOne();
//     } catch (err) {
//         console.log(err);
//     }
//     // console.log(this.r);
//     next();
// });

// // This is how we calculate the statistics for the tour
// reviewSchema.post(/^findOneAnd/, async function (doc) {
//     // await this.findOne(); does NOT work here, query has already executed
//     // this.r = await this.findOne(); does NOT work here, query has already executed
//     // this.r.constructor points to the current model
//     await doc.constructor.calcAverageRatings(doc.tour);
// });

// New way of calculating the statistics for the tour
reviewSchema.post(/save|^findOne/, async (doc, next) => {
    await doc.constructor.calcAverageRatings(doc.tour);
    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
