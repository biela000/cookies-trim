import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';
import Song from '../models/songModel';

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

	musicHome: catchAsync(async (req: Request, res: Response): Promise<void> => {
		// Redirect to the favorite songs page
		res.status(308).redirect('/music/songs/favorite');
	}),
};