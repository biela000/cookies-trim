import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';

export default {
	register: catchAsync(async (req: Request, res: Response) => {
		res.status(200).json({
			status: 'success',
			message: 'This route is not yet defined!'
		});
	}),
	login: catchAsync(async (req: Request, res: Response) => {
		res.status(200).json({
			status: 'success',
			message: 'This route is not yet defined!'
		});
	}),
};