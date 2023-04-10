import {NextFunction, Request, Response} from 'express';
import catchAsync from '../utils/catchAsync';
import Song, {SongDocument} from '../models/songModel';
import Settings from '../Settings';
import fs from 'fs';
import AppError from '../utils/appError';
import path from 'path';
import {IAudioMetadata, parseFile} from 'music-metadata';
import zlib from 'zlib';

// This function reads given song file's metadata and returns a SongDocument
const createSongFromMetadata = async (fileDirectory: string, filename: string): Promise<SongDocument> => {
	const fileMetadata: IAudioMetadata = await parseFile(path.join(fileDirectory, filename));
	return new Song({
		title: fileMetadata.common.title,
		filename,
		artist: fileMetadata.common.artist,
		album: fileMetadata.common.album,
		year: fileMetadata.common.year,
		genre: fileMetadata.common.genre,
		track: fileMetadata.common.track,
		cover: fileMetadata.common.picture,
		duration: fileMetadata.format.duration,
	});
};

export default {
	getAll: catchAsync(async (req: Request, res: Response): Promise<void> => {
		// TODO: Allow filtering and sorting results by query parameters
		// Get all songs from the database
		const songs: SongDocument[] = await Song.find({});

		res.status(200).json({
			status: 'success',
			data: {
				songs,
			}
		});
	}),

	getOne: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { id } = req.params;

		// Get the song with the given id from the database
		const song: SongDocument | null = await Song.findById(id);

		// If there is no song with the given id, return an error
		if (!song) {
			next(new AppError('No song found with that ID', 404));
			return;
		}

		res.status(200).json({
			status: 'success',
			data: {
				song,
			}
		});
	}),

	updateAll: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		// Get the path to the songs directory
		const songDirectory: string = path.join(Settings.settings['locations']['music'], 'songs');

		// If hard is true, all songs in the database will be deleted
		// and all songs in the songs directory will be added to the database
		const { hard } = req.query;
		const isUpdateHard: boolean = hard === 'true';
		if (isUpdateHard) {
			// Delete all songs in the database
			await Song.deleteMany({});

			// Read all files in the songs directory
			fs.readdir(songDirectory, async (err, filenames: string[]): Promise<void> => {
				// If there is an error, return an error
				if (err) {
					next(new AppError('Error while reading directory!', 500));
					return;
				}

				// Create a SongDocument for each song in the songs directory
				const songDocuments: SongDocument[] =
					await Promise.all(filenames.map(async (filename: string): Promise<SongDocument> => {
						return await createSongFromMetadata(songDirectory, filename);
					}));

				// Insert all SongDocuments into the database
				// Inserting all SongDocuments at once is much faster than inserting them one by one
				const insertedSongs = await Song.insertMany(songDocuments);

				// Return all songs in the database
				res.status(200).json({
					status: 'success',
					data: {
						songs: insertedSongs,
					}
				});
			});
		} else {
			// If hard is false, only songs that are in the songs directory but not in the database
			// will be added to the database and only songs that are in the database but not in the songs directory
			// will be deleted from the database
			fs.readdir(songDirectory, async (err, filenames: string[]): Promise<void> => {
				// If there is an error, return an error
				if (err) {
					next(new AppError('Error while reading directory!', 500));
					return;
				}

				// Get all songs in the database
				const songs: SongDocument[] = await Song.find({});

				// Get all songs that are in the database but not in the songs directory
				const songsToDelete: SongDocument[] = songs.filter((song: SongDocument) => {
					return !filenames.includes(song.filename);
				});

				// Get filenames of all songs in the database
				const dbFilenames: string[] = songs.map((song: SongDocument) => song.filename);
				// Get all songs that are in the songs directory but not in the database
				const songsToAdd: string[] = filenames.filter((filename: string) => !dbFilenames.includes(filename));

				// Delete all songs that are in the database but not in the songs directory
				Song.deleteMany({ filename: { $in: songsToDelete.map((song: SongDocument) => song.filename) } });

				// Convert all songs to add to SongDocuments
				const songDocuments: SongDocument[] =
					await Promise.all(songsToAdd.map(async (filename: string): Promise<SongDocument> => {
						return await createSongFromMetadata(songDirectory, filename);
					}));

				// Add all songs that are in the songs directory but not in the database
				const insertedSongs = await Song.insertMany(songDocuments);

				res.status(200).json({
					status: 'success',
					data: {
						songs: insertedSongs,
					}
				});
			});
		}
	}),

	toggleFavorite: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { id } = req.params;

		// Get the song with the given id from the database
		const updatedSong: SongDocument | null = await Song.findById(id);

		// If there is no song with the given id, return an error
		if (!updatedSong) {
			next(new AppError('No song found with that ID', 404));
			return;
		}

		// Toggle the favorite property of the song
		updatedSong.favorite = !updatedSong.favorite;

		// Save the updated song to the database
		await Song.findByIdAndUpdate(id, updatedSong);

		res.status(200).json({
			status: 'success',
			data: {
				song: updatedSong,
			}
		});
	}),

	streamSong: catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		// Extract the name and file from the request parameters
		// These params need to be decoded because they are encoded in the url so song names with spaces work
		const name: string = decodeURIComponent(req.params.name);
		const file: string = decodeURIComponent(req.params.file);

		// Get the path to the streams directory
		const processedSongsDirectory: string = path.join(Settings.settings['locations']['music'], 'songs-ffmpeg-output');

		// Get the path to the file
		const filePath: string = path.join(processedSongsDirectory, name, file);

		// Get file's extension
		const extension: string = path.extname(file);

		let stream: fs.ReadStream;

		// If the file's extension is .m3u8, the file is a manifest file
		// If the file's extension is .ts, the file is a segment file
		switch (extension) {
		case '.m3u8':
			// If the file is a manifest file, set the content type to application/vnd.apple.mpegurl
			res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

			// Create a stream to the file with the 'utf-8' encoding
			stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
			break;
		case '.ts':
			// If the file is a segment file, set the content type to video/MP2T
			res.setHeader('Content-Type', 'video/MP2T');

			// Create a stream to the file
			stream = fs.createReadStream(filePath);
			break;
		default:
			// If the file's extension is not .m3u8 or .ts, return an error
			next(new AppError('Invalid file extension!', 400));
			return;
		}

		// Pipe the stream to the response
		stream.pipe(res);
	}),
};