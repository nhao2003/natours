const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const sharp = require('sharp');
const multer = require('multer');

const multerStorage = multer.memoryStorage(); // store the image as a buffer in memory

// cb is callback
const multerFilter = (req, file, cb) => {
  // test if the uploaded file is an image
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) Cover image
  // user-7676767dfdfdf-78787878787.jpeg
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // resize the image to 500x500
    .toFormat('jpeg') // convert the image to jpeg
    .jpeg({ quality: 90 }) // compress the image to 90% quality
    .toFile(`public/img/tours/${req.body.imageCover}`); // save the image to the file system
  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
      .resize(2000, 1333) // resize the image to 500x500
      .toFormat('jpeg') // convert the image to jpeg
      .jpeg({ quality: 90 }) // compress the image to 90% quality
      .toFile(`public/img/tours/${filename}`); // save the image to the file system
      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};

exports.createTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.getAllTours = factory.getAll(Tour);

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const tour = await Tour.findByIdAndDelete(id);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const { year } = req.params;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // radius of earth in miles
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
  }
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// /distances/:latlng/unit/:unit
// /distances/34.111745,-118.113491/unit/mi
exports.getDistances = catchAsync(async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // radius of earth in miles
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
  }
  const distances = await Tour.aggregate([
    {
      // geoNear always needs to be the first stage in the pipeline
      $geoNear: {
        // near is the point from which to calculate the distances
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        // distanceField is the name of the field that will be added to each output document
        distanceField: 'distance',
        // distanceMultiplier is the factor to multiply all distances returned by the query
        distanceMultiplier: multiplier,
      },
    },
    {
      // project is used to specify or restrict the fields to return
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});