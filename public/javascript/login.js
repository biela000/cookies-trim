import { showNotification } from './utils/notification.js';

const loginForm = document.querySelector('.login-form');
const usernameInput = document.querySelector('.username-input');
const passwordInput = document.querySelector('.password-input');

loginForm.addEventListener('submit', async (event) => {
	event.preventDefault();

	if (!usernameInput.value || !passwordInput.value) {
		showNotification('Error', 'Please enter a username and password', 'error');
		return;
	}

	const userInfo = {
		username: usernameInput.value,
		password: passwordInput.value
	};

	const response = await fetch('/api/v1/users/login', {
		method: 'POST',
		body: JSON.stringify(userInfo),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (response.status === 200) {
		window.location.href = '/music';
	} else if (response.status === 401) {
		showNotification('Error', 'Invalid username or password', 'error');
	} else {
		showNotification('Error', 'Something went wrong', 'error');
	}
});