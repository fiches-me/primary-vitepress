import type { MarkdownRenderer, UserConfig } from "vitepress";
import { mermaidPlugin } from "./plugins/vitepress-mermaid/index.js";
import { taskCheckboxPlugin } from "./plugins/markdown-it-task-checkbox.js";
import { obsidianWikilinksPlugin } from "./plugins/markdown-it-obsidian-wikilinks.js";
import mdItTaskLists from "markdown-it-task-lists";
import mdItObsidianCallouts from "markdown-it-obsidian-callouts";

/**
 * VitePress configuration extension for Primary Theme.
 * Enables markdown plugins for Mermaid diagrams and interactive task checkboxes,
 * plus Obsidian callouts and Obsidian wikilinks compatibility,
 * and sets SSR noExternal to ensure CSS and modules are processed by Vite.
 */
export const primaryThemeConfig: UserConfig = {
  markdown: {
    math: true,
    config(md: MarkdownRenderer) {
      md.use(mermaidPlugin);
      md.use(taskCheckboxPlugin);
      md.use(mdItObsidianCallouts);
      md.use(obsidianWikilinksPlugin);
      md.use(mdItTaskLists, { enabled: true });
    },
  },
  vite: {
    ssr: {
      noExternal: ["primary-vitepress", "mermaid"],
    },
  },
};

export { mermaidPlugin, taskCheckboxPlugin, obsidianWikilinksPlugin };
export default primaryThemeConfig;
