import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import Song, { SongDocument } from '../models/songModel';
import Settings from '../Settings';
import fs from 'fs';
import AppError from '../utils/appError';
import path from 'path';
import { IAudioMetadata, parseFile } from 'music-metadata';
import SongUtils from '../utils/songUtils';
import ffmpeg from 'fluent-ffmpeg';

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


// A function creating a SongDocument for each song in the songs directory
const createSongDocumentsFromFilenames =
    async (fileDirectory: string, filenames: string[]): Promise<SongDocument[]> => {
        return await Promise.all(filenames.map(
            async (filename: string): Promise<SongDocument> => {
                return await createSongFromMetadata(fileDirectory, filename);
            }
        ));
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
        // Set the ffmpeg output directory path and the song directory path
        const ffmpegOutputDirectory = path.join(Settings.settings['locations']['music'], 'songs-ffmpeg-output');
        const songDirectory: string = path.join(Settings.settings['locations']['music'], 'songs');

        // Array of insterted Songs to use and return later
        let insertedSongs: SongDocument[] = [];

        // If hard is true, all songs in the database will be deleted
        // and all songs in the songs directory will be added to the database
        const { hard } = req.query;
        const isUpdateHard: boolean = hard === 'true';

        // Read all files in the songs directory
        const filenames: string[] = await fs.promises.readdir(songDirectory);

        if (isUpdateHard) {
            // Delete all songs in the database
            await Song.deleteMany({});

            try {
                // Create a SongDocument for each song in the songs directory
                const songDocuments: SongDocument[] =
                    await createSongDocumentsFromFilenames(songDirectory, filenames);

                // Insert all SongDocuments into the database
                // Inserting all SongDocuments at once is much faster than inserting them one by one
                insertedSongs = await Song.insertMany(songDocuments);
            } catch (err) {
                return next(new AppError('Could not create song documents from files', 500));
            }
        } else {
            // If hard is false, only songs that are in the songs directory but not in the database
            // will be added to the database and only songs that are in the database but not in the songs directory
            // will be deleted from the database

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

            try {
                // Convert all songs to add to SongDocuments
                const songDocuments: SongDocument[] =
                    await createSongDocumentsFromFilenames(songDirectory, songsToAdd);

                // Add all songs that are in the songs directory but not in the database
                insertedSongs = await Song.insertMany(songDocuments);
            } catch (err) {
                return next(new AppError('Could not create song documents from files', 500));
            }
        }


        const numberOfSongsToConvert: number = insertedSongs.length;
        let numberOfConvertedSongs = 0;

        // Convert all songs to HLS streams
        // Use forEach instead of normal for loop because I want to cue all the songs at once
        insertedSongs.forEach((song: SongDocument) => {
            SongUtils.convertSongToHlsStream(
                song,
                ffmpegOutputDirectory,
                songDirectory
            ).then((songFfmpegInstance: ffmpeg.FfmpegCommand | null) => {
                songFfmpegInstance?.on('end', () => {
                    if (++numberOfConvertedSongs === numberOfSongsToConvert) {
                        res.status(200).json({
                            status: 'success',
                            data: {
                                songs: insertedSongs,
                            }
                        });
                    }
                });
            });
        });

        // If there are no inserted songs, return a success response
        // This is necessary because the forEach loop above will not be executed if there are no inserted songs
        if (numberOfSongsToConvert === 0) {
            res.status(200).json({
                status: 'success',
                data: {
                    songs: insertedSongs,
                }
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
