/* eslint-disable import/extensions */
import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import VideoController from '../controllers/video.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/').get(VideoController.getAllVideosForUser);

router.route('/').post(
  AuthMiddleware.verifyTokens,
  upload.fields([
    {
      name: 'video',
      maxCount: 1,
    },
    {
      name: 'thumbnail',
      maxCount: 1,
    },
  ]),
  VideoController.createOrPublishVideo,
);

router.route('/:videoId').put(
  AuthMiddleware.verifyTokens,
  upload.single('thumbnail'),
  VideoController.updateVideo,
);

router.route('/:videoId').delete(
  AuthMiddleware.verifyTokens,
  VideoController.deleteVideo,
);

export default router;
