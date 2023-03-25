import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';
import AppError from '../utils/appError';
import User from '../models/userModel';
import jwt from 'jsonwebtoken';

const signToken = (id: string) => {
	return jwt.sign({ id, iat: Date.now() }, process.env.JWT_SECRET!, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};


export default {
	register: catchAsync(async (req: Request, res: Response) => {
		res.status(200).json({
			status: 'success',
			message: 'This route is not yet defined!'
		});
	}),
	login: catchAsync(async (req: Request, res: Response, next) => {
		const { username, password } = req.body;

		if (!username || !password) {
			return next(new AppError('Please provide email and password!', 400));
		}

		const user = await User.findOne({ name: username }).select('+password');

		if (!user || !(await user.correctPassword(password, user.password))) {
			return next(new AppError('Incorrect username or password', 401));
		}

		const token = signToken(user._id);

		res.cookie('jwt', token, {
			httpOnly: true,
		});

		res.status(200).json({
			status: 'success',
			token,
		});
	}),
	protect: catchAsync(async (req: Request, res: Response, next) => {
		let token: string;
		if (req.headers.authentication &&
			typeof req.headers.authentication === 'string' &&
			req.headers.authentication.startsWith('Bearer')) {
			token = req.headers.authentication.split(' ')[1];
			// validate token
			const decoded: jwt.JwtPayload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
			// check if user still exists
			const currentUser = await User.findById(decoded.id);
			if (!currentUser) {
				return next(new AppError('The user belonging to this token does no longer exist.', 401));
			}
			// check if user changed password after the token was issued
			if (currentUser.changedPasswordAfter(decoded.iat!)) {
				return next(new AppError('User recently changed password! Please log in again.', 401));
			}
		} else {
			return next(new AppError('You are not logged in! Please log in to get access.', 401));
		}

		next();
	})
};