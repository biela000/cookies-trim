const notification = document.querySelector('.notification');

notification.addEventListener('click', () => {
	notification.classList.remove('show');
	notification.classList.remove('error');
	notification.classList.remove('success');
});

export const showNotification = (title, text, status) => {
	notification.classList.add('show');
	notification.classList.add(status);
	notification.querySelector('.title').textContent = title;
	notification.querySelector('.description').textContent = text;
	setTimeout(() => {
		notification.classList.remove('show');
		notification.classList.remove(status);
	}, 3000);
};