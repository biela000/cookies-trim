import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';
import Song, { SongDocument } from '../models/songModel';
import Settings from '../Settings';
import path from 'path';

const musicMenuOptions: { name: string, url: string }[] = [
    {
        name: '[FAVORITE]',
        url: '/music/songs/favorite',
    },
    {
        name: '[ALL]',
        url: '/music/songs',
    }
];

const musicSubmenuOptions: { name: string, url: string }[] = [
    {
        name: '[SONGS]',
        url: '/music/songs',
    },
    {
        name: '[ALBUMS]',
        url: '/music/albums',
    },
    {
        name: '[ARTISTS]',
        url: '/music/artists',
    },
];

export default { login: catchAsync(async (req: Request, res: Response): Promise<void> => { res.status(200).render('pages/login', { title: 'Login' }); }),

    musicFavoriteSongs: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // Get all songs that are marked as favorite
        const favoriteSongs = await Song.find({ favorite: true });

        res.status(200).render('pages/music', {
            options: musicMenuOptions,
            subOptions: musicSubmenuOptions,
            sectionTitle: 'FAVORITE SONGS',
            items: favoriteSongs,
            favorite: true,
        });
    }),

    musicAllSongs: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // TODO: Allow filtering and sorting results by query parameters
        // Get all songs from the database
        const allSongs = await Song.find({});

        res.status(200).render('pages/music', {
            options: musicMenuOptions,
            subOptions: musicSubmenuOptions,
            sectionTitle: 'ALL SONGS',
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

        let songCoverBase64 = '';
        if (song.cover && song.cover.length > 0 && song.cover[0].data) {
            songCoverBase64 = 'data:image/jpeg;base64,' + song.cover[0].data.toString('base64');
        }

        res.status(200).render('pages/song', {
            sectionTitle: song.title,
            cover: songCoverBase64,
            title: song.title,
            artist: song.artist,
            songname: encodeURIComponent(song.filename),
            ffmpegOutputDirectory,
            songDirectory,
        });
    }),

    musicHome: catchAsync(async (req: Request, res: Response): Promise<void> => {
        // Redirect to the favorite songs page
        res.status(308).redirect('/music/songs/favorite');
    }),
};
