import { Request, Response, NextFunction } from 'express';
import AppError from './appError';

const handleDevelopmentErrors = (error: AppError, res: Response) => {
	res.status(error.statusCode).json({
		status: error.status,
		error: error,
		message: error.message,
		stack: error.stack
	});
};

const handleProductionErrors = (error: AppError, res: Response) => {
	// Operational, trusted error: send message to client
	if (error.isOperational) {
		res.status(error.statusCode).json({
			status: error.status,
			message: error.message
		});
	} else {
		// Programming or other unknown error: don't leak error details
		// 1) Log error
		console.error('ERROR', error);
		// 2) Send generic message
		res.status(500).json({
			status: 'error',
			message: 'Something went very wrong!'
		});
	}
};

export default (error: AppError, req: Request, res: Response, next: NextFunction) => {
	error.statusCode = error.statusCode || 500;
	error.status = error.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		handleDevelopmentErrors(error, res);
	} else if (process.env.NODE_ENV === 'production') {
		handleProductionErrors(error, res);
	}
};