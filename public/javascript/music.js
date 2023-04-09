import { showNotification } from './utils/notification.js';

const songElements = document.querySelectorAll('.main-section-item');

songElements.forEach(songElement => {
	songElement.addEventListener('click', (event) => {
		// If the user clicks on the favorite icon, don't navigate to the song page
		if (event.target.classList.contains('main-section-item-favorite-icon')) {
			return;
		}

		// Get the song id from the data attribute and navigate to the song page
		const songId = songElement.dataset.dbId;
		window.location.href = `/music/songs/${songId}`;
	});

	const favoriteIcon = songElement.querySelector('.main-section-item-favorite-icon');

	favoriteIcon.addEventListener('click', async () => {
		// Get the song id from the data attribute
		const songId = songElement.dataset.dbId;

		// If the song is already a favorite and the user is on the favorite page, remove the song from the DOM
		if (songElement.dataset.isFavorite === 'true' && window.location.pathname === '/music/songs/favorite') {
			songElement.remove();
		} else {
			// Toggle the favorite icon
			songElement.dataset.isFavorite = songElement.dataset.isFavorite === 'true' ? 'false' : 'true';
		}

		// Send a PUT request to the server to update the song's favorite status
		const response = await fetch(`/api/v1/songs/favorite/${songId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		// If the request was successful, show an appropriate success notification
		if (response.ok) {
			const parsedResponse = await response.json();
			const { song } = parsedResponse.data;
			showNotification('Success', song.favorite ? 'Song added to favorites' : 'Song removed from favorites',
				'success');
		} else {
			showNotification('Error', 'Something went wrong', 'error');
		}
	});
});