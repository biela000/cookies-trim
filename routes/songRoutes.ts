import express, { Router } from 'express';
import songController from '../controllers/songController';
import authController from '../controllers/authController';

const router: Router = express.Router();

// This needs to be protected later but for now it's fine
router.route('/')
    .get(songController.getAll)
    .patch(songController.updateAll);

router.route('/favorite/:id')
    .all(authController.protect)
    .put(songController.toggleFavorite);

router.route('/stream/:name/:file')
    .all(authController.protect)
    .get(songController.streamSong);

export default router;
