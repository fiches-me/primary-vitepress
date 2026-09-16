declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    any
  >;
  export default component;
}

declare module "*.css" {
  const css: string;
  export default css;
}

declare module "@mdit/plugin-footnote" {
  const footnote: any;
  export { footnote };
}

declare module "markdown-it-task-lists" {
  const plugin: any;
  export default plugin;
}

declare module "markdown-it-obsidian-callouts" {
  const plugin: any;
  export default plugin;
}

declare module "markdown-it-obsidian" {
  const plugin: any;
  export default plugin;
}
