export default class Notification {
    static notificationContainer = document.querySelector('.notifications');
    static notifications = [];
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
            this.notifications = this.notifications.filter(
                (currentNotification) => currentNotification !== notification
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
        this.notifications.push(notification);

        setTimeout(closeNotification, this.notificationTime);
    }
}
