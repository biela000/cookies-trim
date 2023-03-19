// Custom error class for handling errors
export default class AppError extends Error {
	public statusCode: number;
	public status: string;
	public isOperational: boolean;
	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}