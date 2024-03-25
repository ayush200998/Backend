/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import mongoose, { isValidObjectId } from 'mongoose';

// Model
import Playlist from '../models/playlist.models.js';
import Video from '../models/video.models.js';

// Custom utils
import asyncHandler from '../utils/asyncHandler.js';
import ApiErrors from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';

const PlaylistController = {};

PlaylistController.createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiErrors(400, 'Missing params');
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiErrors(500, 'failed to create playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, 'Playlist created successfully'));
});

PlaylistController.updatePlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;

  if (!name || !description) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiErrors(400, 'Invalid playlist id');
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiErrors(404, 'Playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiErrors(401, 'User not authorized to update this playlist');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        'Playlist updated successfully',
      ),
    );
});

PlaylistController.deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiErrors(400, 'Invalid playlist id');
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiErrors(404, 'Playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiErrors(401, 'User not authorized to update this playlist');
  }

  await Playlist.findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        'Playlist deleted successfully',
      ),
    );
});

PlaylistController.addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {
    playlistId,
    videoId,
  } = req.params;

  const { user } = req;

  if (!videoId || !playlistId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, 'Invalid video or playlist id');
  }

  // Get the playlist and video info
  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (playlist.owner._id.toString() !== user._id) {
    throw new ApiErrors(401, 'User is not the owner of the playlist');
  }

  if (video.owner._id.toString() !== user._id) {
    throw new ApiErrors(401, 'User is not the owner of the video');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: video._id,
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
        updatedPlaylist,
        'Added video to playlist sucessfully',
      ),
    );
});

PlaylistController.removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {
    playlistId,
    videoId,
  } = req.params;

  const { user } = req;

  if (!videoId || !playlistId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, 'Invalid video or playlist id');
  }

  // Get the playlist and video info
  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (playlist.owner._id.toString() !== user._id) {
    throw new ApiErrors(401, 'User is not the owner of the playlist');
  }

  if (video.owner._id.toString() !== user._id) {
    throw new ApiErrors(401, 'User is not the owner of the video');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: video._id,
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
        updatedPlaylist,
        'Removed video from playlist sucessfully',
      ),
    );
});

// Get all playlist created by a user
PlaylistController.getAllPlaylists = asyncHandler(async (req, res) => {
  const {
    userId,
  } = req.params;

  if (!userId) {
    throw new ApiErrors(400, 'Missing params');
  }

  if (!isValidObjectId(userId)) {
    throw new ApiErrors(400, 'Invalid user id');
  }

  const playlists = Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'Videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',

      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: '$videos',
        },
        totalViews: {
          $sum: '$videos.views',
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        'Fetched user playlists sucessfully',
      ),
    );
});

PlaylistController.getPlaylistDetails = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiErrors(400, 'Invalid playlist id');
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiErrors(404, 'Playlist not found');
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: '$videos',
        },
        totalViews: {
          $sum: '$videos.views',
        },
        owner: {
          $first: '$owner',
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          'videoFile.url': 1,
          'thumbnail.url': 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          'avatar.url': 1,
        },
      },
    },

  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlistVideos[0],
        'Fetched playlist details successfully.',
      ),
    );
});

export default PlaylistController;
