/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import mongoose, { isValidObjectId } from 'mongoose';

// Models
import Comment from '../models/comment.models.js';
import Video from '../models/video.models.js';

// Custom utils
import asyncHandler from '../utils/asyncHandler.js';
import ApiErrors from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';
import Like from '../models/like.models.js';

const CommentController = {};

CommentController.getAllCommentsForVideo = asyncHandler(async (req, res) => {
  const {
    videoId,
  } = req.params;
  const {
    page = 1,
    limit = 10,
  } = req.query;
  const {
    user,
  } = req;

  if (!videoId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiErrors(400, 'Invalid video id');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors('Video not found');
  }

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: 'Users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $lookup: {
        from: 'Likes',
        localField: '_id',
        foreignField: 'comment',
        as: 'likes',
      },
    },
    {
      $addFields: {
        owner: {
          $first: '$owner',
        },
        likesCount: {
          $size: '$likes',
        },
        isLiked: {
          $cond: {
            if: { $in: [user._id, '$likes.likedBy'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        id: 1,
        content: 1,
        createdAt: 1,
        likesCount: 1,
        isLiked: 1,
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        comments,
        'Fetched all comments successfully',
      ),
    );
});

CommentController.createComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiErrors(400, 'Content is required');
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors(404, 'Video not found');
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiErrors(500, 'Failed to add comment please try again');
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        comment,
        'Comment added successfully',
      ),
    );
});

CommentController.updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const { user } = req;

  if (!content) {
    throw new ApiErrors(400, 'content is required');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiErrors(404, 'Comment not found');
  }

  if (comment?.owner.toString() !== user._id.toString()) {
    throw new ApiErrors(401, 'User is not allowed to update comment');
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content,
      },
    },
    { new: true },
  );

  if (!updatedComment) {
    throw new ApiErrors(500, 'Failed to update comment please try again');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedComment,
        'Comment updated successfully',
      ),
    );
});

CommentController.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { user } = req;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiErrors(404, 'Comment not found');
  }

  if (comment?.owner.toString() !== user._id.toString()) {
    throw new ApiErrors(401, 'User is not allowed to update comment');
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedComment,
        'Comment deleted successfully',
      ),
    );
});

export default CommentController;
