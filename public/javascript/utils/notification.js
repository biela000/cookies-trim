export default class Notification {
    static notificationContainer = document.querySelector('.notifications');
    static notificationTimeouts = [];
    static waitingNotifications = [];
    static notificationTime = 5000;

    static showNotification(title, text, status) {
        const areNotificationsOverflowing =
            this.notificationContainer.scrollHeight >
            this.notificationContainer.clientHeight;

        if (areNotificationsOverflowing) {
            this.waitingNotifications.push({ title, text, status });
            return;
        }

        const notification =
            document.querySelector('.notification-template').cloneNode(true);

        notification.classList.remove('notification-template');
        notification.classList.add('notification');
        notification.classList.add(status);

        notification.querySelector('.notification-title').textContent = title;
        notification.querySelector('.notification-message').textContent = text;

        const closeNotification = () => {
            this.notificationContainer.removeChild(notification);

            const notificationTimeout = this.notificationTimeouts.find(
                (notificationTimeout) => notificationTimeout.id === timeoutID
            );

            clearTimeout(notificationTimeout.timeout);

            this.notificationTimeouts = this.notificationTimeouts.filter(
                (notificationTimeout) => notificationTimeout.id !== timeoutID
            );

            if (this.waitingNotifications.length > 0) {
                const nextNotification = this.waitingNotifications.shift();
                this.showNotification(
                    nextNotification.title,
                    nextNotification.text,
                    nextNotification.status
                );
            }
        };

        notification.addEventListener('click', closeNotification);

        this.notificationContainer.appendChild(notification);

        const notificationTimeout = setTimeout(closeNotification, this.notificationTime);
        const timeoutID = Date.now() + Math.floor(Math.random() * 1000000);
        this.notificationTimeouts.push({
            id: timeoutID,
            timeout: notificationTimeout
        });
    }
}
