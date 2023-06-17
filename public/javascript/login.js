import Notification from './utils/notification.js';
import AnimationUtils from './utils/AnimationUtils.js';

const loginForm = document.querySelector('.login-form');
const usernameInput = document.querySelector('.username-input');
const passwordInput = document.querySelector('.password-input');
const matrixContainer = document.querySelector('.matrix');

AnimationUtils.fillElementWithBinary(matrixContainer);
setInterval(() => {
    matrixContainer.innerHTML = '';
    AnimationUtils.fillElementWithBinary(matrixContainer);
}, 500);

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!usernameInput.value || !passwordInput.value) {
        Notification.showNotification('Error', 'Please enter a username and password', 'error');
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
        Notification.showNotification('Error', 'Invalid username or password', 'error');
    } else {
        Notification.showNotification('Error', 'Something went wrong', 'error');
    }
});
