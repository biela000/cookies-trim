import catchAsync from '../utils/catchAsync';
import Settings from '../Settings';
import { Request, Response } from 'express';

export default {
	updateSettings: catchAsync(async (req: Request, res: Response) => {
		Settings.settings = req.body;
		res.status(200).json({
			status: 'success',
			message: 'This route does not handle specific errors yet!'
		});
	}),
};