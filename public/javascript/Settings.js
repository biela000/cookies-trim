export default class Settings {
	static locations = {
		'music': '/music',
		'movies': '/movies',
		'tv-shows': '/tv-shows',
	};

	static putSettings = async () => {
		const settingsObj = {
			locations: this.locations,
		};
		
		const response = await fetch('/api/v1/platform/settings', {
			method: 'PUT',
			body: JSON.stringify(settingsObj),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	};

	static setResourceLocation = async (resource, location) => {
		if (!this.locations[resource]) {
			throw new Error('Invalid resource');
		}
		this.locations[resource] = location;
		const response = await fetch('/api/v1/platform/settings', {
			method: 'PUT',
			body: JSON.stringify({ resource, location }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	};
}