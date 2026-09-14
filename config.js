import { mermaidPlugin } from './plugins/vitepress-mermaid/index.ts'
import { taskCheckboxPlugin } from './plugins/markdown-it-task-checkbox.mts'

/**
 * VitePress configuration extension for Primary Theme.
 * Enables markdown plugins for Mermaid diagrams and interactive task checkboxes,
 * and sets SSR noExternal to ensure CSS and modules are processed by Vite.
 */
export const primaryThemeConfig = {
  markdown: {
    config(md) {
      md.use(mermaidPlugin)
      md.use(taskCheckboxPlugin)
    }
  },
  vite: {
    ssr: {
      noExternal: ['vitepress-theme-primary', 'mermaid']
    }
  }
}

export { mermaidPlugin, taskCheckboxPlugin }
export default primaryThemeConfig
