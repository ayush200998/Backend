/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import mongoose, { isValidObjectId } from 'mongoose';

// Models
import Like from '../models/like.models.js';

// Custom utils
import asyncHandler from '../utils/asyncHandler.js';
import ApiErrors from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';

const LikeController = {};

LikeController.toggleVideoLike = asyncHandler(async (req, res) => {
  const {
    videoId,
  } = req.params;
  const { user } = req;

  if (!videoId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiErrors(400, 'Ínvalid video id');
  }

  // Check if user has already liked the video
  const videoLikedAlready = await Like.findOne({
    video: videoId,
    likedBy: user._id,
  });

  // If video is already liked delete the collection
  if (videoLikedAlready) {
    const deletedLike = await Like.findByIdAndDelete(videoLikedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLike,
          'Removed like from video',
        ),
      );
  }

  // Else create a new like document
  const newlyCreatedLike = await Like.create({
    video: videoId,
    likedBy: user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newlyCreatedLike,
        'Added like to the video successfully',
      ),
    );
});

LikeController.toggleCommentLike = asyncHandler(async (req, res) => {
  const {
    commentId,
  } = req.params;
  const { user } = req;

  if (!commentId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiErrors(400, 'Ínvalid comment id');
  }

  // Check if user has already liked the comment
  const commentLikedAlready = await Like.findOne({
    comment: commentId,
    likedBy: user._id,
  });

  // If comment is already liked delete the collection
  if (commentLikedAlready) {
    const deletedLike = await Like.findByIdAndDelete(commentLikedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLike,
          'Removed like from comment',
        ),
      );
  }

  // Else create a new like document
  const newlyCreatedLike = await Like.create({
    comment: commentId,
    likedBy: user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newlyCreatedLike,
        'Added like to the comment successfully',
      ),
    );
});

LikeController.toggleTweetLike = asyncHandler(async (req, res) => {
  const {
    tweetId,
  } = req.params;
  const { user } = req;

  if (!tweetId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiErrors(400, 'Ínvalid tweet id');
  }

  // Check if user has already liked the tweet
  const tweetLikedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: user._id,
  });

  // If tweet is already liked delete the collection
  if (tweetLikedAlready) {
    const deletedLike = await Like.findByIdAndDelete(tweetLikedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLike,
          'Removed like from tweet',
        ),
      );
  }

  // Else create a new like document
  const newlyCreatedLike = await Like.create({
    tweet: tweetId,
    likedBy: user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newlyCreatedLike,
        'Added like to the tweet successfully',
      ),
    );
});

LikeController.getAllLikedVideos = asyncHandler(async (req, res) => {
  const { user } = req;

  const userLikedVideos = Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: 'Videos',
        localField: 'video',
        foreignField: '_id',
        as: 'likedVideo',
        pipeline: [
          {
            $lookup: {
              from: 'Users',
              localField: 'owner',
              foreignField: '_id',
              as: 'ownerDetails',
            },
            $unwind: '$ownerDetails',
          },
        ],
      },
    },
    {
      $unwind: '$likedVideo',
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        likedVideo: {
          title: 1,
          description: 1,
          'thumbnail.url': 1,
          'videoFile.url': 1,
          duration: 1,
          views: 1,
          createdAt: 1,
        },
        ownerDetails: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userLikedVideos,
        'Fetched all the liked videos successfully',
      ),
    );
});

export default LikeController;
