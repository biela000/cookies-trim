export default class Link {
    constructor(path, element) {
        this.path = path;
        this.element = element;

        this.element.addEventListener('click', this.onClick.bind(this));
    }

    onClick(event) {
        event.preventDefault();
        window.history.pushState({}, '', this.path);
        window.dispatchEvent(new Event('popstate'));
    }
}
