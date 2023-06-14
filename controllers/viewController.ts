import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';
import Song, { SongDocument } from '../models/songModel';
import Settings from '../Settings';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import SongUtils from '../utils/songUtils';

const musicMenuOptions: { name: string, url: string }[] = [
    {
        name: 'Favorite',
        url: '/music/songs/favorite',
    },
    {
        name: 'All Songs',
        url: '/music/songs',
    }
];

export default {
    login: catchAsync(async (req: Request, res: Response): Promise<void> => {
        res.status(200).render('pages/login', { title: 'Login' });
    }),

    musicFavoriteSongs: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // Get all songs that are marked as favorite
        const favoriteSongs = await Song.find({ favorite: true });

        res.status(200).render('pages/music', {
            options: musicMenuOptions,
            sectionTitle: 'Favorite Songs',
            items: favoriteSongs,
        });
    }),

    musicAllSongs: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // TODO: Allow filtering and sorting results by query parameters
        // Get all songs from the database
        const allSongs = await Song.find({});

        res.status(200).render('pages/music', {
            options: musicMenuOptions,
            sectionTitle: 'All Songs',
            items: allSongs,
        });
    }),

    musicOneSong: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // Set the ffmpeg output directory path and the song directory path
        const ffmpegOutputDirectory = path.join(Settings.settings['locations']['music'], 'songs-ffmpeg-output');
        const songDirectory = path.join(Settings.settings['locations']['music'], 'songs');

        // Get the song id from the request parameters
        const { id } = req.params;

        // Get the song with the given id from the database
        const song: SongDocument | null = await Song.findById(id);

        // If there is no song with the given id, return an error
        if (!song) {
            // TODO: Render an error page
            // res.status(404).render('pages/error', { title: 'Error', message: 'No song found with that ID' });
            return;
        }

        // Convert the song to HLS stream
        const ffmpegInstance: ffmpeg.FfmpegCommand | null =
            await SongUtils.convertSongToHlsStream(
                song,
                ffmpegOutputDirectory,
                songDirectory
            );

        const renderSongPage = (): void => {
            res.status(200).render('pages/song', {
                song,
                options: musicMenuOptions,
            });
        };

        // If the ffmpeg instance is null, the song has already been converted to HLS stream
        if (!ffmpegInstance) {
            return renderSongPage();
        }

        // If the ffmpeg instance is not null, the song is being converted to HLS stream
        ffmpegInstance.on('end', () => {
            console.log('Finished processing');
            renderSongPage();
        });
    }),

    musicHome: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // Redirect to the favorite songs page
        res.status(308).redirect('/music/songs/favorite');
    }),
};
