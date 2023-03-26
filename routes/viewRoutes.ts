import express, { Router } from 'express';
import viewController from '../controllers/viewController';
import authController from '../controllers/authController';

const router: Router = express.Router();

router.get('/login', viewController.login);
router.route('/music')
	.all(authController.protect)
	.get(viewController.music);

export default router;