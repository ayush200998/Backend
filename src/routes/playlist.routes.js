/* eslint-disable import/extensions */
import { Router } from 'express';

// Controller
import PlaylistController from '../controllers/playlist.controller';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/:userId').get(PlaylistController.getAllPlaylists);
router.route('/:playlistId').get(PlaylistController.getPlaylistDetails);
router.route('/').post(
  AuthMiddleware.verifyTokens,
  PlaylistController.createPlaylist,
);
router.route('/:playlistId').put(
  AuthMiddleware.verifyTokens,
  PlaylistController.updatePlayList,
);
router.route('/:playlistId').delete(
  AuthMiddleware.verifyTokens,
  PlaylistController.deletePlaylist,
);
router.route('/:playlistId/:videoId').post(
  AuthMiddleware.verifyTokens,
  PlaylistController.addVideoToPlaylist,
);
router.route('/:playlistId/:videoId').delete(
  AuthMiddleware.verifyTokens,
  PlaylistController.removeVideoFromPlaylist,
);

export default router;
