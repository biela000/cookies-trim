import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import AppError from './utils/appError';
import errorHandler from './utils/errorHandler';
import userRouter from './routes/userRoutes';
import viewRouter from './routes/viewRoutes';
import songRouter from './routes/songRoutes';

const app: Express = express();

app.set('view engine', 'pug');

// Enable logger in dev mode when in development environment
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

app.use(express.json());
// Cookie parser for setting JWT cookie
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/v1/users', userRouter);
app.use('/api/v1/songs', songRouter);
app.use('/', viewRouter);

// This handler will execute if no other route handler is executed
app.all('*', (req: Request, res: Response, next: NextFunction) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Setting up middleware for error handling
app.use(errorHandler);

export default app;