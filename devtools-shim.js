// No-op shim used in production builds to avoid bundling @vue/devtools
export default {}
export const setupDevtools = () => {}
export const setupDevtoolsPlugin = () => {}
export const timeline = { addLayer: () => {}, addEvent: () => {} }
