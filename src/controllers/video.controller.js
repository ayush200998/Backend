/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
import mongoose, { isValidObjectId } from 'mongoose';
import VideoModel from '../models/video.model.js';
import ApiErrors from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import CloudinaryHelper from '../utils/cloudinary.js';

const VideoController = {};

// Get all the videos for a user
VideoController.getAllVideosForUser = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    userId,
  } = req.query;

  const pipeline = [];

  // Get all the videos added by a user
  if (query) {
    pipeline.push({
      $search: {
        index: 'search-videos',
        text: {
          query,
          path: ['title', 'description'],
        },
      },
    });
  }

  // Add owner if userId is present
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiErrors.BadRequest(400, 'Invalid user id');
    }
    pipeline.push({
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    });
  }

  // Add sorting
  pipeline.push({
    $sort: {
      createdAt: -1,
    },
  });

  // Get user details
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails',
        pipeline: [
          {
            $project: {
              username: 1,
              'avatar.url': 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$ownerDetails',
    },
  );

  const videoAggregate = VideoModel.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await VideoModel.aggregatePaginate(videoAggregate, options);

  return res.status(200).json(
    new ApiResponse(
      200,
      video,
      'Fetched all videos successfully',
    ),
  );
});

VideoController.createOrPublishVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    duration,
  } = req.body;

  if (!title || !description || !duration) {
    throw new ApiErrors(400, 'Missing params');
  }

  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  // Upload video to Cloudinary

  const video = await CloudinaryHelper.uploadOnCloudinaryWithStreams(videoLocalPath);

  const thumbnail = await CloudinaryHelper.uploadOnCloudinary(thumbnailLocalPath);

  if (!video?.url || !thumbnail.url) {
    throw new ApiErrors(500, 'Error while uploading video');
  }

  // Create new video
  const newVideo = await VideoModel.create({
    title,
    description,
    duration,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    owner: req.user?._id,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      newVideo,
      'Video created successfully',
    ),
  );
});

export default VideoController;
