import Route from './Route.js';

export default class Router {
    constructor(root) {
        this.routes = [];
        this.root = root;
    }

    addRoute(path, getComponent) {
        this.routes.push(new Route(path, getComponent));
    }

    match(path) {
        // Match routes remembering params that can be used in the path and ignoring query params
        let params;

        const route = this.routes.find(route => {
            // Split path into parts
            const routePathParts = route.path.split('/');
            const pathParts = path.split('/');

            // Remove query params
            const lastPathPart = pathParts[pathParts.length - 1];
            if (lastPathPart.includes('?')) {
                pathParts[pathParts.length - 1] =
                    lastPathPart.split('?')[0];
            }

            // Check if both routes have the same number of parts
            if (routePathParts.length !== pathParts.length) {
                return false;
            }

            // Check if the route matches the path and save params
            params = {};

            for (let i = 0; i < routePathParts.length; i++) {
                if (routePathParts[i].startsWith(':')) {
                    params[routePathParts[i].substring(1)] = pathParts[i];
                } else if (routePathParts[i] !== pathParts[i]) {
                    return false;
                }
            }
            return true;
        });

        return { route, params };
    }

    async navigate(path) {
        const search = new URL(`http://localhost/${path}`).searchParams;
        const { route, params } = this.match(path);

        if (route) {
            this.root.innerHTML = '';
            const component = await route.render(params, search);
            return this.root.append(...component.children);
        }
        // TODO: Handle 404
        this.root.innerHTML = '404';
    }
    
    async start() {
        await this.navigate(window.location.pathname + window.location.search);
        window.addEventListener('popstate', async () => {
            await this.navigate(window.location.pathname + window.location.search);
        });
    }
}
