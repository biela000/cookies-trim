import express, { Router } from 'express';
import songController from '../controllers/songController';
import authController from '../controllers/authController';

const router: Router = express.Router();

// This needs to be protected later but for now it's fine
router.route('/').patch(songController.updateAll);

router.route('/favorite/:songId')
	.all(authController.protect)
	.put(songController.toggleFavorite);

export default router;