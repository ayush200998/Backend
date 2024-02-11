/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
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

export default UserController;
