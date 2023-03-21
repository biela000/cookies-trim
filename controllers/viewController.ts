import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';

export default {
	login: catchAsync(async (req: Request, res: Response) => {
		res.status(200).render('pages/login', { title: 'Login' });
	}),
};