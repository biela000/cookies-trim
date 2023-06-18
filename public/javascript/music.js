import Notification from './utils/notification.js';
import Link from './Link.js';
import Router from './Router.js';

// This function needs to accept iconElement because JS
const addListeners = (songElement, iconElement) => {
    songElement.addEventListener('click', (event) => {
        // If the user clicks on the favorite icon, don't navigate to the song page
        if (event.target.classList.contains('main-section-item-favorite-icon')) {
            return;
        }

        // Get the song id from the data attribute and navigate to the song page
        const songId = songElement.dataset.dbId;
        window.location.href = `/music/songs/${songId}`;
    });

    iconElement.addEventListener('click', async () => {
        // Get the song id from the data attribute
        const songId = songElement.dataset.dbId;

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
            Notification.showNotification('Success', song.favorite ? 'Song added to favorites' : 'Song removed from favorites',
                'success');
            // If the song is already a favorite and the user is on the favorite page, remove the song from the DOM
            if (songElement.dataset.isFavorite === 'true' && window.location.search.includes('favorite=true')) {
                songElement.remove();
            } else {
                // Toggle the favorite icon
                songElement.dataset.isFavorite = songElement.dataset.isFavorite === 'true' ? 'false' : 'true';
            }
        } else {
            Notification.showNotification('Error', 'Something went wrong', 'error');
        }
    });
};

const musicLinkElements = document.querySelectorAll('.menu-link');
const musicLinks = [];

musicLinkElements.forEach(link => {
    musicLinks.push(new Link(link.dataset.path, link));
});

const musicRouter = new Router(document.querySelector('.main-section-content'));

const mainSectionTemplate = document.querySelector('.main-section-template');
const mainSectionElementTemplate = document.querySelector('.main-section-element-template');

const createSongListComponent = (songs) => {
    const mainSection = mainSectionTemplate.cloneNode(true);
    mainSection.classList.remove('main-section-template');
    mainSection.innerHTML = '';

    songs.forEach(song => {
        let imgSrc = '/media/images/unknown.png';
        if (song.cover && song.cover.length > 0 && song.cover[0].data) {
            imgSrc = 'data:image/jpeg;base64,' + song.cover[0].data.toString('base64');
        }

        const songElement = mainSectionElementTemplate.cloneNode(true);
        songElement.classList.remove('main-section-element-template');

        songElement.dataset.dbId = song._id;
        songElement.dataset.isFavorite = song.favorite ? 'true' : 'false';

        songElement.innerHTML = songElement.innerHTML
            .replace(/{{id}}/g, song._id)
            .replace(/{{title}}/g, song.title)
            .replace(/{{imgSrc}}/g, imgSrc)
            .replace(/{{artist}}/g, song.artist)
            .replace(/{{album}}/g, song.album)
            .replace(/{{duration}}/g, song.duration)
            .replace(/{{favorite}}/g, song.favorite ? 'true' : 'false');

        const favoriteIcon = songElement.querySelector('.main-section-item-favorite-icon');
        addListeners(songElement, favoriteIcon);

        mainSection.appendChild(songElement);
    });

    return mainSection;
};

musicRouter.addRoute('/music/songs', async (params, search) => {
    const response = await fetch(`/api/v1/songs?favorite=${search.get('favorite')}`);
    const parsedResponse = await response.json();
    const { songs } = parsedResponse.data;

    return createSongListComponent(songs);
});

musicRouter.start();
