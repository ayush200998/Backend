/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import jwt from 'jsonwebtoken';
import ApiErrors from '../utils/ApiErrors.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';

const AuthMiddleware = {};

AuthMiddleware.verifyTokens = asyncHandler(async (req, _, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer', '');

    if (!accessToken) {
      throw ApiErrors(401, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      throw new ApiErrors(401, 'User tokens not found');
    }

    const user = await User.findById(decodedToken._id).select('-password -refreshToken');

    if (!user) {
      throw new ApiErrors(401, 'Invalid tokens');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiErrors(401, error?.message || 'Invalid access tokens');
  }
});

export default AuthMiddleware;
