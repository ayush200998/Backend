/* eslint-disable import/extensions */
import { Router } from 'express';
import UserController from '../controllers/user.controller.js';

// Middlewares
import { upload } from '../middlewares/multer.middleware.js';

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

export default router;
