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

// Secured routes
router.route('/logout').post(
  AuthMiddleware.verifyTokens,
  UserController.logoutUser,
);

export default router;
