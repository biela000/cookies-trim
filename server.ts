import dotenv from 'dotenv';
import app from './app';

// Catch every exception that is not tied to server's async process
// (All exceptions that are not in server's functions like get, etc.)
process.on('uncaughtException', (error: Error) => {
	console.log('uncaughtException!\n', error.name, error.message);
	process.exit(1);
});

dotenv.config({ path: './config.env' });

const port = process.env.PORT ?? 3000;

app.listen(+port, () => {
	console.log(`App listening on port ${port}...`);
});