# 🎨 Primary for VitePress

A Vitepress port of the famous Obsidian Theme [primary](https://primary-theme.github.io) by Cecil.

## 📥 Installation

This bad boy is published on [npm](https://www.npmjs.com/package/primary-vitepress). You can install it using your favorite package manager.

```bash
npm install primary-vitepress
```

## ⚙️ Setup

### 1. Enable Theme in `.vitepress/theme/index.js`

Primary come with a extension of the default style, that you can add 

```ts
import PrimaryTheme from 'primary-vitepress'
import './override.css' // If you want to override CSS variables

export default PrimaryTheme;

```

### 2. Enable Plugins in `.vitepress/config.mts`

To enable the included markdown plugins (Mermaid diagrams & custom task checkboxes), extend the theme config in your VitePress configuration:

```ts
import { defineConfig } from "vitepress";
import { primaryThemeConfig } from "primary-vitepress/config";

export default defineConfig({
  extends: primaryThemeConfig,
  // Your site config here...
});
```

Or, if you use a plugin that require a custom config object

```ts
import { defineConfig, UserConfig } from "vitepress";
import { primaryThemeConfig } from 'primary-vitepress/config';
import { withSidebar } from "vitepress-sidebar";

// https://vitepress.dev/reference/site-config
const vitePressConfigs: UserConfig<any> = {
  // Your configuration
  title: "...",
  // Add This
  extends: primaryThemeConfig,
}

export default defineConfig(withSidebar(vitePressConfigs, sidebarOptions));
```
