import catchAsync from '../utils/catchAsync';
import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';
import User, { UserDocument } from '../models/userModel';
import jwt from 'jsonwebtoken';

// JWT_SECRET environment variable is required to generate a JWT token
const signToken = (id: string) => {
    return jwt.sign({ id, iat: Date.now() }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    });
};

export default {
    addUser: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { username, password, passwordConfirm } = req.body;

        // 1) Check if email and password exist
        if (!username || !password) {
            return next(new AppError('Please provide username and password!', 400));
        }

        // 2) Check if user already exists
        const user: UserDocument | null = await User.findOne({ name: username });
        if (user) {
            return next(new AppError('User already exists!', 400));
        }

        // 3) Create new user
        const newUser: UserDocument = await User.create({
            name: username,
            password,
            passwordConfirm
        });

        // 4) If everything ok, send a response containing new user's data
        res.status(201).json({
            status: 'success',
            data: {
                username: newUser.name,
            },
        });
    }),
    login: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Example request body:
        // { "username": "admin", "password": "admin" }
        const { username, password } = req.body;

        // 1) Check if email and password exist
        if (!username || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        const user: UserDocument | null = await User.findOne({ name: username }).select('+password');

        // 2) Check if user exists and password is correct
        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError('Incorrect username or password', 401));
        }

        // 3) If everything ok, send token to client and set cookie
        const token = signToken(user._id);

        res.cookie('jwt', token, {
            httpOnly: true,
        });

        res.status(200).json({
            status: 'success',
            token,
        });
    }),
    protect: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        let token: string;

        // 1) Check if token is sent in header or cookie
        const isTokenSentInHeader: boolean | undefined | '' = req.headers.authentication &&
            typeof req.headers.authentication === 'string' &&
            req.headers.authentication.startsWith('Bearer');
        const isTokenSentInCookie: boolean = req.cookies.jwt && typeof req.cookies.jwt === 'string';

        if (isTokenSentInHeader || isTokenSentInCookie) {
            // 2) Set token to either header or cookie
            token = isTokenSentInHeader ?
                (req.headers.authentication as string)?.split(' ')[1] :
                req.cookies.jwt;

            // 3) Verify token
            const decoded: jwt.JwtPayload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

            // 4) Check if user still exists
            const currentUser: UserDocument | null = await User.findById(decoded.id);
            if (!currentUser) {
                return next(new AppError('The user belonging to this token does no longer exist.', 401));
            }

            // 5) Check if user changed password after the token was issued
            // decoded.iat is always defined: look at the definition of signToken in this file
            if (currentUser.changedPasswordAfter(decoded.iat!)) {
                return next(new AppError('User recently changed password! Please log in again.', 401));
            }
        } else {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        // Grant access to protected route
        next();
    })
};
