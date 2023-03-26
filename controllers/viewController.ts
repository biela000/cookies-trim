import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';

export default {
	login: catchAsync(async (req: Request, res: Response) => {
		res.status(200).render('pages/login', { title: 'Login' });
	}),

	music: catchAsync(async (req: Request, res: Response) => {
		res.status(200).render('pages/music', {
			options: [
				{
					name: 'Favorite',
					url: '/music/favorite',
				}
			],
			sectionTitle: 'Music',
			items: [
				{
					image: 'https://i.scdn.co/image/ab67616d0000b273b0b2b2b2b2b2b2b2b2b2b2b2',
					title: 'SCARING THE HOES vol. 1',
					artist: 'JPEGMAFIA, Danny Brown',
				}
			]
		});
	}),
};