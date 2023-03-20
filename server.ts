import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app';

// Catch every exception that is not tied to server's async process
// (All exceptions that are not in server's functions like get, etc.)
process.on('uncaughtException', (error: Error) => {
	console.log('uncaughtException!\n', error.name, error.message);
	process.exit(1);
});

dotenv.config({ path: './config.env' });

// If mongoose.connect() fails, it will throw an error caught by the unhandledRejection handler
const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD ?? '') ?? '';
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const port = process.env.PORT ?? 3000;

app.listen(+port, () => {
	console.log(`App listening on port ${port}...`);
});

// Catch every uncaught exception that is tied to server's async process
// (All exceptions that are in server's functions like get, etc.)
process.on('unhandledRejection', (error: Error) => {
	console.log('unhandledRejection!\n', error.name, error.message);
	process.exit(1);
});