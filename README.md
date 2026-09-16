# 🎨 Primary for VitePress

A Vitepress port of the famous Obsidian Theme [primary](https://primary-theme.github.io) by Cecil.

## 📥 Installation

This bad boy is published on [npm](https://www.npmjs.com/package/primary-vitepress). You can install it using your favorite package manager.

```bash
npm install primary-vitepress
```

## ⚙️ Setup

### 1. Enable Theme in `.vitepress/theme/index.ts` (or `.js`)

```ts
import type { Theme } from "vitepress";
import PrimaryTheme from "primary-vitepress";
import "./custom.css"; // Optional: your own CSS overrides

export default {
  extends: PrimaryTheme,
} satisfies Theme;
```

### 2. Enable Plugins in `.vitepress/config.ts` (or `.js`)

To enable the included markdown plugins (Mermaid diagrams & custom task checkboxes), extend the theme config in your VitePress configuration:

```ts
import { defineConfig } from "vitepress";
import { primaryThemeConfig } from "primary-vitepress/config";

export default defineConfig({
  extends: primaryThemeConfig,
  // Your site config here...
});
```
