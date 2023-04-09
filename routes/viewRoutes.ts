import express, { Router } from 'express';
import viewController from '../controllers/viewController';
import authController from '../controllers/authController';

const router: Router = express.Router();

router.get('/login', viewController.login);

router.route('/music')
	.all(authController.protect)
	.get(viewController.musicHome);

router.route('/music/songs')
	.all(authController.protect)
	.get(viewController.musicAllSongs);

router.route('/music/songs/favorite')
	.all(authController.protect)
	.get(viewController.musicFavoriteSongs);

export default router;