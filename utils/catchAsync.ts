import { Request, Response, NextFunction } from 'express';

// This is a wrapper function that will catch any errors thrown in the async function
// and pass it to the next function (which is the error handler)
export default (watchedFunction: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		watchedFunction(req, res, next).catch((error: Error) => next(error));
	};
};