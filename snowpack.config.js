module.exports = {
    mount: {
        public: { url: '/', static: true },
        // NOTE: could be '/build'... doesn't work w/ netlify default
        src: '/dist'
    },
    plugins: ['@snowpack/plugin-svelte'],
    routes: [
        /* Enable an SPA Fallback in development: */
        // {"match": "routes", "src": ".*", "dest": "/index.html"},
    ],
    optimize: {
        /* Example: Bundle your final build: */
        // "bundle": true,
    },
    packageOptions: {
        /* ... */
    },
    devOptions: {
        open: 'none'
    },
    buildOptions: {
        /* ... */
    }
}
