/* eslint-disable import/extensions */
import asyncHandler from '../utils/asyncHandler.js';

const UserController = {};

UserController.registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'OK',
  });
});

export default UserController;
