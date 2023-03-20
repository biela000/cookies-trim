import express, { Router } from 'express';
import viewController from '../controllers/viewController';

const router: Router = express.Router();

router.get('/login', viewController.login);

export default router;