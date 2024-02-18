/* eslint-disable import/extensions */
import { Router } from 'express';
import UserController from '../controllers/user.controller.js';

// Middlewares
import { upload } from '../middlewares/multer.middleware.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  UserController.registerUser,
);

router.route('/login').post(UserController.loginUser);
router.route('/refresh_token').post(UserController.refreshTokens);

// Secured routes
router.route('/logout').post(
  AuthMiddleware.verifyTokens,
  UserController.logoutUser,
);

router.route('/update_avatar').put(
  AuthMiddleware.verifyTokens,
  upload.single('avatar'),
  UserController.updateUserAvatar,
);

router.route('/update_cover').put(
  AuthMiddleware.verifyTokens,
  upload.single('coverImage'),
  UserController.updateUserCoverImage,
);

router.route('/update_details').put(
  AuthMiddleware.verifyTokens,
  UserController.updateUserDetails,
);

router.route('/update_password').put(
  AuthMiddleware.verifyTokens,
  UserController.updateUserPassword,
);

router.route('/current_user').get(
  AuthMiddleware.verifyTokens,
  UserController.getCurrentUser,
);

router.route('/profile/:username').get(
  AuthMiddleware.verifyTokens,
  UserController.getUserProfileFromUsername,
);

router.route('/watch_history').get(
  AuthMiddleware.verifyTokens,
  UserController.getUserWatchHistory,
);

export default router;
