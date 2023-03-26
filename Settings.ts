import fs from 'fs';
import path from 'path';

export default class Settings {
	private static _settings = fs.readFileSync(path.join(__dirname, '../data/settings.json'), 'utf-8');

	public static get settings(): Settings {
		return Settings._settings;
	}

	public static set settings(settings: any) {
		Settings._settings = settings;
	}
}