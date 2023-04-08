// Custom error class for handling errors
export default class AppError extends Error {
	public statusCode: number;
	public status: string;
	public isOperational: boolean;

	constructor(message: string, statusCode: number) {
		// Call Error constructor
		super(message);

		// Set prototype explicitly
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		// Mark error as operational, so we can differentiate between AppError and other errors
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}