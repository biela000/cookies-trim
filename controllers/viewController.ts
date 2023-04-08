import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';
import Song from '../models/songModel';

const musicMenuOptions: { name: string, url: string }[] = [
	{
		name: 'Favorite',
		url: '/music/favorite',
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

	musicHome: catchAsync(async (req: Request, res: Response): Promise<void> => {
		// Redirect to the favorite songs page
		res.status(308).redirect('/music/songs/favorite');
	}),
};