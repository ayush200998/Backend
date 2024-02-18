/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';
import UserHelper from '../helpers/user.helper.js';
import ApiErrors from '../utils/ApiErrors.js';
import CloudinaryHelper from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';

const UserController = {};

UserController.registerUser = asyncHandler(async (req, res) => {
  // Get all the required fields from User.
  const {
    username,
    email,
    fullName,
    password,
  } = req.body;

  // Validations [correct-format, not-empty]
  UserHelper.validateFormData([
    username,
    email,
    fullName,
    password,
  ]);

  // Check if there is an existing account [email, username]
  const existingUser = await User.findOne({
    $or: [
      {
        email,
      },
      {
        username,
      },
    ],
  });

  if (existingUser) {
    throw new ApiErrors(409, 'User already exists');
  }

  // Check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = '';

  if (
    req.files
        && Array.isArray(req.files.coverImage)
        && req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiErrors(400, 'Avatar file is required');
  }

  // Upload them to cloudinary, avatar
  const avatar = await CloudinaryHelper.uploadOnCloudinary(avatarLocalPath);
  const coverImage = await CloudinaryHelper.uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, 'Avatar file is required');
  }

  // Create user object
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });

  // Remove password and refresh_tokens from response
  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  // Check for user creation and return response.
  if (!createdUser) {
    throw new ApiErrors(500, 'Something went wrong while registering the user');
  }

  return res.status(201).json(new ApiResponse(200, createdUser, 'User registered successfully'));
});

UserController.loginUser = asyncHandler(async (req, res) => {
  // Get the email or username
  const {
    username,
    email,
    password,
  } = req.body;

  if (!(username || email)) {
    throw new ApiErrors(400, 'Username OR Email is required');
  }

  // Find user object with email or username
  const user = await User.findOne({
    $or: [
      {
        email,
      },
      {
        username,
      },
    ],
  });

  if (!user) {
    throw new ApiErrors(404, 'No user found');
  }

  // Password check
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiErrors(401, 'Incorrect password');
  }

  // Get the access and refresh tokens
  const { accessToken, refreshToken } = await UserHelper.generateAccessAndRefreshTokens(user._id);

  // Return user
  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  // Generate cookie
  const cookieOptions = UserHelper.getCookieOptions();

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully',
      ),
    );
});

UserController.logoutUser = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: '',
      },
    },
    {
      new: true,
    },
  );

  const cookieOptions = UserHelper.getCookieOptions();

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(
      new ApiResponse(
        200,
        {},
        'User logged out successfully',
      ),
    );
});

UserController.refreshTokens = asyncHandler(async (req, res) => {
  const userRefreshTokens = req.cookies.refreshToken || req.body.refreshToken;

  if (!userRefreshTokens) {
    throw new ApiErrors(401, 'Unauthoized access');
  }

  // Get the user data
  try {
    const decodedToken = jwt.verify(
      userRefreshTokens,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new Error(400, 'Invalid refresh token');
    }

    if (userRefreshTokens !== user?.refreshToken) {
      throw new ApiErrors(400, 'Refresh token is expired or used');
    }

    const { accessToken, refreshToken: newRefreshToken } = await UserHelper.generateAccessAndRefreshTokens(user._id);

    const cookieOptions = UserHelper.getCookieOptions();

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          'Token refreshed successfullt',
        ),
      );
  } catch (error) {
    throw new ApiErrors(401, error?.message || 'Invalid tokens');
  }
});

UserController.updateUserPassword = asyncHandler(async (req, res) => {
  // Get the old and new password from user
  const {
    oldPassword,
    newPassword,
  } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new ApiErrors(400, 'Missing parameters');
  }

  if (oldPassword === newPassword) {
    throw new ApiErrors(400, 'New password cannot be same as old password');
  }

  // Fetch the user and check if the password is matching with the data provided by user
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiErrors(401, 'User not found');
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiErrors(401, 'Incorrect password');
  }

  // Set the new password and save
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        'Password updated successfully',
      ),
    );
});

UserController.updateUserDetails = asyncHandler(async (req, res) => {
  const {
    email,
    fullName,
  } = req.body;

  if (!(email || fullName)) {
    throw new ApiErrors(400, 'Missing parameters');
  }

  // Find user and validate the fields from DB value
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        email,
        fullName,
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        'User details updated successfully',
      ),
    );
});

UserController.getCurrentUser = asyncHandler(async (req, res) => res
  .status(200)
  .json(
    new ApiResponse(
      200,
      req.user,
      'User fetched successfully',
    ),
  ));

UserController.updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, 'Avatar file is missing');
  }

  const avatar = await CloudinaryHelper.uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new Error(400, 'Error while updating user avatar');
  }

  // Delete the previous file from cloudinary
  await CloudinaryHelper.deleteFromCloudinary(avatar.url);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          updatedAvatar: avatar.url,
        },
        'Updated avatar successfully',
      ),
    );
});

UserController.updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiErrors(400, 'Cover image file is missing');
  }

  const coverImage = await CloudinaryHelper.uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new Error(400, 'Error while updating user cover image');
  }

  // Delete the previous file from cloudinary
  await CloudinaryHelper.deleteFromCloudinary(coverImage.url);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          updatedCoverImage: coverImage.url,
        },
        'Updated cover image successfully',
      ),
    );
});

export default UserController;
