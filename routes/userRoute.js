const express = require('express');
const multer = require('multer');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

userRouter.param('id', userController.checkID);

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);

userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
userRouter.use(authController.protect);

userRouter.patch('/updateMyPassword', authController.updatePassword);
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.patch('/updateMe', userController.uploadPhoto, userController.resizeUserPhoto , userController.updateMe);
userRouter.delete('/deleteMe', userController.deleteMe);

// Restrict all routes after this middleware to admin only
userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
