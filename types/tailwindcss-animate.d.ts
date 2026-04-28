import type { PluginCreator } from "tailwindcss/plugin"

declare module "tailwindcss-animate" {
    const animate: PluginCreator
    export default animate
}