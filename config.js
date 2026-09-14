import { mermaidPlugin } from './plugins/vitepress-mermaid/index.js'
import { taskCheckboxPlugin } from './plugins/markdown-it-task-checkbox.js'
import { footnote } from "@mdit/plugin-footnote";
import mdItTaskLists from "markdown-it-task-lists";

import mdItObsidianCallouts from "markdown-it-obsidian-callouts";
import markdownItObsidian from "markdown-it-obsidian";
import mathjax3 from "markdown-it-mathjax3";

/**
 * VitePress configuration extension for Primary Theme.
 * Enables markdown plugins for Mermaid diagrams and interactive task checkboxes,
 * plus Obsidian callouts, footnotes, and mathjax3 for Obsidian compatibility.
 * and sets SSR noExternal to ensure CSS and modules are processed by Vite.
 */

export const primaryThemeConfig = {
  markdown: {
    config(md) {
      md.use(mermaidPlugin)
      md.use(taskCheckboxPlugin)
      md.use(footnote);
      md.use(mdItObsidianCallouts);
      md.use(markdownItObsidian, { enabled: true });
      md.use(mathjax3);
      md.use(mdItTaskLists, { enabled: true });
    }
  },
  vite: {
    ssr: {
      noExternal: ['primary-vitepress', 'mermaid']
    }
  }
}

export { mermaidPlugin, taskCheckboxPlugin }
export default primaryThemeConfig
