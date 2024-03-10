/* eslint-disable import/extensions */
import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import VideoController from '../controllers/video.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

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
export default router;
