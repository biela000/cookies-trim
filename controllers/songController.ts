import {NextFunction, Request, Response} from 'express';
import catchAsync from '../utils/catchAsync';
import Song, {SongDocument} from '../models/songModel';
import Settings from '../Settings';
import fs from 'fs';
import AppError from '../utils/appError';
import path from 'path';
import {IAudioMetadata, parseFile} from 'music-metadata';

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
	updateAll: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const { hard } = req.query;
		const isUpdateHard = hard === 'true';
		// const songDirectory = path.join(Settings.settings['locations']['music'], 'songs');
		const songDirectory = path.join(__dirname, '../../data/music/songs');
		if (isUpdateHard) {
			await Song.deleteMany({});
			fs.readdir(songDirectory, async (err, filenames) => {
				if (err) {
					next(new AppError('Error while reading directory!', 500));
					return;
				}
				for (const filename of filenames) {
					const song: SongDocument = await createSongFromMetadata(songDirectory, filename);
					await Song.create(song);
				}
				res.status(200).json({
					status: 'success',
					data: {
						songs: await Song.find({}),
					}
				});
			});
		} else {
			fs.readdir(songDirectory, async (err, filenames) => {
				if (err) {
					next(new AppError('Error while reading directory!', 500));
					return;
				}
				const songs: SongDocument[] = await Song.find({});
				const songsToDelete: SongDocument[] = songs.filter(song => {
					return !filenames.includes(song.filename);
				});
				const dbFilenames: string[] = songs.map(song => song.filename);
				const songsToAdd: string[] = filenames.filter(filename => !dbFilenames.includes(filename));
				Song.deleteMany({ filename: { $in: songsToDelete.map(song => song.filename) } });
				await Song.create(songsToAdd.map(async (filename) =>  {
					return await createSongFromMetadata(songDirectory, filename);
				}));
				res.status(200).json({
					status: 'success',
					data: {
						songs: await Song.find({}),
					}
				});
			});
		}
	}),
};