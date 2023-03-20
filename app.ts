import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import sass from 'node-sass';
import path from 'path';
import AppError from './utils/appError';
import errorHandler from './utils/errorHandler';
import catchAsync from './utils/catchAsync';
import userRouter from './routes/userRoutes';
import viewRouter from './routes/viewRoutes';

const app: Express = express();

// Enable logger in dev mode when in development environment
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

app.use(express.json());
app.use(catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const filename = req.path.split('/').pop();
	if (filename?.match(/\.s[ac]ss$/)) {
		res.status(200).send(sass.renderSync({
			file: path.join(__dirname, 'public', req.path)
		}).css.toString());
	} else {
		next();
	}
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', userRouter);
app.use('/', viewRouter);

// This handler will execute if no other route handler is executed
app.all('*', (req: Request, res: Response, next: NextFunction) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Setting up middleware for error handling
app.use(errorHandler);

export default app;