import fs from 'fs';
import path from 'path';

export interface ISettings {
	locations: {
		music: string;
		movies: string;
		'tv-shows': string;
	}
}

export default class Settings {
	private static _settings: ISettings = JSON.parse(
		fs.readFileSync(path.join(__dirname, '../data/settings.json'), 'utf-8')
	);

	public static get settings(): ISettings {
		return Settings._settings;
	}

	public static set settings(settings: any) {
		Settings._settings = settings;
	}
}