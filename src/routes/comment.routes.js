/* eslint-disable import/extensions */
import { Router } from 'express';
import AuthMiddleware from '../middlewares/auth.middleware';
import CommentController from '../controllers/comment.controller';

const router = Router();

router.route('/:videoId').post(
  AuthMiddleware.verifyTokens,
  CommentController.createComment,
);

router.route('/:commentId').put(
  AuthMiddleware.verifyTokens,
  CommentController.updateComment,
);

router.route('/:commentId').delete(
  AuthMiddleware.verifyTokens,
  CommentController.deleteComment,
);

router.route('/:videoId').get(
  AuthMiddleware.verifyTokens,
  CommentController.getAllCommentsForVideo,
);

export default router;
