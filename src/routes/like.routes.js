/* eslint-disable import/extensions */
import { Router } from 'express';

// Controller
import LikeController from '../controllers/like.controller';

// Middleware
import AuthMiddleware from '../middlewares/auth.middleware';

const router = Router();

// Add like to video
router.route('/:videoId').post(
  AuthMiddleware.verifyTokens,
  LikeController.toggleVideoLike,
);
// Add like to comment
router.route('/:commentId').post(
  AuthMiddleware.verifyTokens,
  LikeController.toggleCommentLike,
);
// Add like to tweet
router.route('/:tweetId').post(
  AuthMiddleware.verifyTokens,
  LikeController.toggleTweetLike,
);
// Get all the liked videos of a user
router.route('/').get(
  AuthMiddleware.verifyTokens,
  LikeController.getAllLikedVideos,
);

export default router;
