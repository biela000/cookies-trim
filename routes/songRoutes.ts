import express, { Router } from 'express';
import songController from '../controllers/songController';

const router: Router = express.Router();

router.route('/').patch(songController.updateAll);

export default router;