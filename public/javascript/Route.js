export default class Route {
    constructor(path, getComponent) {
        this.path = path;
        this.getComponent = getComponent;
    }

    async render(params, search) {
        return await this.getComponent(params, search);
    }
}
