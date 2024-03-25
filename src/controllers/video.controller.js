/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
import mongoose, { isValidObjectId } from 'mongoose';
import VideoModel from '../models/video.models.js';
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
        owner: new mongoose.Types.ObjectId(userId),
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
              avatar: 1,
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

  const { user } = req;

  if (!title || !description || !duration) {
    throw new ApiErrors(400, 'Missing params');
  }

  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  // Upload video to Cloudinary

  const video = await CloudinaryHelper.uploadOnCloudinaryWithStreams(videoLocalPath, user);

  const thumbnail = await CloudinaryHelper.uploadOnCloudinary(thumbnailLocalPath, user);

  if (!video?.url || !thumbnail.url) {
    throw new ApiErrors(500, 'Error while uploading video');
  }

  // Create new video
  const newVideo = await VideoModel.create({
    title,
    description,
    duration,
    videoFile: {
      url: video.url,
      public_id: video.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
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

// Update the fields like title, description, thumbnail etc
VideoController.updateVideo = asyncHandler(async (req, res) => {
  const {
    videoId,
  } = req.params;

  const {
    title,
    description,
  } = req.body;

  const { user } = req;
  const thumbnailLocalPath = req.file?.path;

  if (!videoId) {
    throw new ApiErrors(400, 'Video id not found');
  }

  if (!title || !description || !thumbnailLocalPath) {
    throw new ApiErrors(400, 'Missing params');
  }

  // Get the video
  const video = await VideoModel.findById(videoId);

  if (!video) {
    throw new ApiErrors(400, 'No video found');
  }

  // Check if user is creator of video
  if (video.owner.toString() !== user._id.toString()) {
    throw new ApiErrors(401, 'User is not the creator of video');
  }

  // Upload the new thumbnail to cloudinary
  const oldThumbnail = video.thumbnail;
  const newThumbnail = await CloudinaryHelper.uploadOnCloudinary(thumbnailLocalPath, user);

  if (!newThumbnail?.url) {
    throw new ApiErrors(500, 'Error while uplloading on cloudinary');
  }

  // Deleted the oldThumbnail andfrom Cloudinary
  await CloudinaryHelper.deleteFromCloudinary(oldThumbnail);

  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: {
          url: newThumbnail.url,
          public_id: newThumbnail.public_id,
        },
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        'Update video successfully',
      ),
    );
});

VideoController.deleteVideo = asyncHandler(async (req, res) => {
  const {
    videoId,
  } = req.params;

  const {
    user,
  } = req;

  if (!videoId) {
    throw new ApiErrors(400, 'Video id not found');
  }

  const video = await VideoModel.findById(videoId);

  if (!video) {
    throw new ApiErrors(400, 'Video not found');
  }

  // Check if user is creator of video
  if (user._id.toString() !== video.owner.toString()) {
    throw new ApiErrors(401, 'User is not the creator of video');
  }

  const oldThumbnail = video.thumbnail;
  const oldVideo = video.videoFile;
  oldVideo.resourceType = 'video';

  // Delete the files from Cloudinary then delete the video
  const deletedVideo = await VideoModel.findByIdAndDelete(videoId).select('-videoFile -thumbnail');
  await CloudinaryHelper.deleteFromCloudinary(oldVideo);
  await CloudinaryHelper.deleteFromCloudinary(oldThumbnail);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedVideo,
        'Video deleted successfully',
      ),
    );
});

export default VideoController;
