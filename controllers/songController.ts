import {NextFunction, Request, Response} from 'express';
import catchAsync from '../utils/catchAsync';
import Song, {SongDocument} from '../models/songModel';
import Settings from '../Settings';
import fs from 'fs';
import AppError from '../utils/appError';
import path from 'path';
import {IAudioMetadata, parseFile} from 'music-metadata';

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
};