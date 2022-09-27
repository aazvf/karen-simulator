// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
    meta: {
        title: "Karen Simulator",
    },
    build: {
        postcss: {
            postcssOptions: {
                plugins: {
                    autoprefixer: {},
                },
            },
        },
    },
});
