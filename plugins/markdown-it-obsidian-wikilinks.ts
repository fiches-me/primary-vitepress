import type { MarkdownRenderer } from "vitepress";
import fs from "node:fs";
import path from "node:path";

export interface VaultFile {
  relPath: string;
  webPath: string;
  routePath: string;
  baseName: string;
  isMd: boolean;
  isMedia: boolean;
  mediaType?: "image" | "video" | "audio" | "pdf" | "note";
}

export interface ResolvedLink {
  href: string;
  isFound: boolean;
  isMedia: boolean;
  mediaType?: "image" | "video" | "audio" | "pdf" | "note";
}

export interface ObsidianWikilinksOptions {
  /**
   * Root directory of the vault / documentation.
   * Defaults to auto-detecting VitePress docs root or process.cwd().
   */
  srcDir?: string;

  /**
   * Base URL prefix for links (e.g. "/" or "/base/").
   */
  baseURL?: string;

  /**
   * URI suffix appended to paths (e.g. ".html" or "").
   * In VitePress, links without suffix are handled natively.
   */
  uriSuffix?: string;

  /**
   * Directory names to ignore during scanning.
   * Defaults to [".git", "node_modules", ".vitepress", "dist", ".obsidian", ".trash", ".cache"].
   */
  ignoreDirs?: string[];

  /**
   * Custom link resolver function.
   */
  resolveLink?: (
    target: string,
    currentFile?: string
  ) => ResolvedLink | string | null;

  /**
   * Additional HTML attributes to add to <a> link tags.
   */
  htmlAttributes?: Record<string, string>;

  /**
   * Post-processor for display label.
   */
  postProcessLabel?: (label: string) => string;

  /**
   * Custom renderer for embeds (![[...]]). Return null to fallback to default renderer.
   */
  renderEmbed?: (embed: {
    target: string;
    href: string;
    isMedia: boolean;
    mediaType?: "image" | "video" | "audio" | "pdf" | "note";
    width?: string;
    height?: string;
    alt?: string;
  }) => string | null;
}

export function slugifyHeading(heading: string): string {
  // If Obsidian block reference (e.g. ^abcd123)
  if (heading.startsWith("^")) return heading;

  return heading
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (e.g. é -> e)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove punctuation
    .replace(/\s+/g, "-") // replace whitespace with -
    .replace(/-+/g, "-"); // deduplicate hyphens
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function detectSrcDir(rootDir: string = process.cwd()): string {
  if (fs.existsSync(path.join(rootDir, ".vitepress"))) {
    return rootDir;
  }
  if (fs.existsSync(path.join(rootDir, "docs", ".vitepress"))) {
    return path.join(rootDir, "docs");
  }
  return rootDir;
}

export class VaultIndexer {
  public srcDir: string;
  public ignoreDirs: Set<string>;
  private fileMap: Map<string, VaultFile> = new Map();
  private basenameMap: Map<string, VaultFile[]> = new Map();
  private indexed: boolean = false;
  private lastIndexTime: number = 0;

  constructor(options?: ObsidianWikilinksOptions) {
    this.srcDir = options?.srcDir || detectSrcDir();
    this.ignoreDirs = new Set(
      options?.ignoreDirs || [
        ".git",
        "node_modules",
        ".vitepress",
        "dist",
        ".obsidian",
        ".trash",
        ".cache",
      ]
    );
  }

  public normalizeKey(k: string): string {
    return k
      .toLowerCase()
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\s+/g, " ");
  }

  public index(force = false): void {
    const now = Date.now();
    if (!force && this.indexed && now - this.lastIndexTime < 3000) {
      return;
    }
    this.fileMap.clear();
    this.basenameMap.clear();
    this._scan(this.srcDir, this.srcDir);
    this.indexed = true;
    this.lastIndexTime = now;
  }

  private _scan(dir: string, root: string): void {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || this.ignoreDirs.has(entry.name)) {
          continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this._scan(full, root);
        } else {
          const rel = path.relative(root, full).replace(/\\/g, "/");
          this._addFile(rel);
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  private _addFile(relPath: string): void {
    const ext = path.extname(relPath).toLowerCase();
    const isMd = ext === ".md";
    const isPublic = relPath.startsWith("public/");

    let webPath = isPublic
      ? "/" + relPath.slice("public/".length)
      : "/" + relPath;
    let routePath = isMd ? webPath.slice(0, -3) : webPath;
    let cleanRel = isMd ? relPath.slice(0, -3) : relPath;
    let baseName = path.basename(relPath, isMd ? ".md" : undefined);

    let mediaType: VaultFile["mediaType"] = undefined;
    const imageExts = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".avif",
      ".ico",
      ".bmp",
    ];
    const videoExts = [".mp4", ".webm", ".ogv", ".mov", ".mkv"];
    const audioExts = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];

    if (imageExts.includes(ext)) mediaType = "image";
    else if (videoExts.includes(ext)) mediaType = "video";
    else if (audioExts.includes(ext)) mediaType = "audio";
    else if (ext === ".pdf") mediaType = "pdf";
    else if (isMd) mediaType = "note";

    const fileInfo: VaultFile = {
      relPath,
      webPath,
      routePath,
      baseName,
      isMd,
      isMedia: !!mediaType && mediaType !== "note",
      mediaType,
    };

    const keys = [
      this.normalizeKey(cleanRel),
      this.normalizeKey(relPath),
      this.normalizeKey(cleanRel.replace(/_/g, " ")),
      this.normalizeKey(cleanRel.replace(/\s+/g, "_")),
    ];

    for (const k of keys) {
      if (!this.fileMap.has(k)) {
        this.fileMap.set(k, fileInfo);
      }
    }

    const bKey = this.normalizeKey(baseName);
    const bKeySpace = this.normalizeKey(baseName.replace(/_/g, " "));
    for (const bk of [bKey, bKeySpace]) {
      if (!this.basenameMap.has(bk)) {
        this.basenameMap.set(bk, []);
      }
      this.basenameMap.get(bk)!.push(fileInfo);
    }
  }

  public resolve(target: string, fromFile?: string): ResolvedLink {
    if (!this.indexed) this.index();

    const cleanTarget = target.trim();
    const norm = this.normalizeKey(cleanTarget);
    const normNoExt = this.normalizeKey(cleanTarget.replace(/\.md$/i, ""));

    // 1. Relative path resolution (./ or ../)
    if (
      (cleanTarget.startsWith("./") || cleanTarget.startsWith("../")) &&
      fromFile
    ) {
      const fromDir = path.dirname(fromFile.replace(/\\/g, "/"));
      const relResolved = path.join(fromDir, cleanTarget).replace(/\\/g, "/");
      const relNorm = this.normalizeKey(relResolved);
      const relNormNoExt = this.normalizeKey(relResolved.replace(/\.md$/i, ""));
      if (this.fileMap.has(relNorm)) {
        const f = this.fileMap.get(relNorm)!;
        return {
          href: f.routePath,
          isFound: true,
          isMedia: f.isMedia,
          mediaType: f.mediaType,
        };
      }
      if (this.fileMap.has(relNormNoExt)) {
        const f = this.fileMap.get(relNormNoExt)!;
        return {
          href: f.routePath,
          isFound: true,
          isMedia: f.isMedia,
          mediaType: f.mediaType,
        };
      }
    }

    // 2. Direct full-path or key match
    if (this.fileMap.has(norm)) {
      const f = this.fileMap.get(norm)!;
      return {
        href: f.routePath,
        isFound: true,
        isMedia: f.isMedia,
        mediaType: f.mediaType,
      };
    }
    if (this.fileMap.has(normNoExt)) {
      const f = this.fileMap.get(normNoExt)!;
      return {
        href: f.routePath,
        isFound: true,
        isMedia: f.isMedia,
        mediaType: f.mediaType,
      };
    }

    // 3. Basename match with directory disambiguation
    const candidates =
      this.basenameMap.get(norm) || this.basenameMap.get(normNoExt);
    if (candidates && candidates.length > 0) {
      if (fromFile && candidates.length > 1) {
        const fromDir = path.dirname(fromFile.replace(/\\/g, "/"));
        const sameDir = candidates.find(
          (c) => path.dirname(c.relPath) === fromDir
        );
        if (sameDir) {
          return {
            href: sameDir.routePath,
            isFound: true,
            isMedia: sameDir.isMedia,
            mediaType: sameDir.mediaType,
          };
        }
      }
      // Prefer shortest path
      candidates.sort(
        (a, b) => a.relPath.split("/").length - b.relPath.split("/").length
      );
      const chosen = candidates[0];
      return {
        href: chosen.routePath,
        isFound: true,
        isMedia: chosen.isMedia,
        mediaType: chosen.mediaType,
      };
    }

    // 4. Retry indexing once if not found (supports newly created files in dev mode)
    if (Date.now() - this.lastIndexTime > 1000) {
      this.index(true);
      if (this.fileMap.has(norm)) {
        const f = this.fileMap.get(norm)!;
        return {
          href: f.routePath,
          isFound: true,
          isMedia: f.isMedia,
          mediaType: f.mediaType,
        };
      }
      if (this.fileMap.has(normNoExt)) {
        const f = this.fileMap.get(normNoExt)!;
        return {
          href: f.routePath,
          isFound: true,
          isMedia: f.isMedia,
          mediaType: f.mediaType,
        };
      }
    }

    // 5. Unresolved / Fallback
    const ext = path.extname(cleanTarget).toLowerCase();
    const isMedia =
      /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp|mp4|webm|ogv|mov|mp3|wav|ogg|pdf)$/i.test(
        cleanTarget
      );
    let mediaType: VaultFile["mediaType"] = undefined;
    if (isMedia) {
      if (/\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i.test(cleanTarget))
        mediaType = "image";
      else if (/\.(mp4|webm|ogv|mov)$/i.test(cleanTarget))
        mediaType = "video";
      else if (/\.(mp3|wav|ogg)$/i.test(cleanTarget)) mediaType = "audio";
      else if (/\.pdf$/i.test(cleanTarget)) mediaType = "pdf";
    }

    let fallbackHref = cleanTarget.startsWith("/")
      ? cleanTarget
      : "/" + cleanTarget;
    if (!isMedia && fallbackHref.endsWith(".md")) {
      fallbackHref = fallbackHref.slice(0, -3);
    }

    return {
      href: fallbackHref,
      isFound: false,
      isMedia,
      mediaType: mediaType || "note",
    };
  }
}

/**
 * Obsidian Wikilinks and Embeds Plugin for Markdown-It and VitePress.
 *
 * Supports:
 * - Links: [[Note]], [[Note|Custom Label]], [[Note#Section]], [[Note#Section|Label]], [[#Section]]
 * - Block references: [[Note#^block-id]], [[#^block-id]]
 * - Image embeds: ![[image.png]], ![[image.png|300]], ![[image.png|300x200]], ![[image.png|Caption]]
 * - Media embeds: audio, video, pdf, note embeds
 * - Automatic vault path resolution, case insensitivity, disambiguation
 * - Adds .internal-link and .is-unresolved CSS classes matching Obsidian & Primary theme
 */
export function obsidianWikilinksPlugin(
  md: MarkdownRenderer,
  options: ObsidianWikilinksOptions = {}
): void {
  const vault = new VaultIndexer(options);

  md.inline.ruler.before("link", "obsidian_wikilinks", (state, silent) => {
    const isEmbed = state.src.slice(state.pos, state.pos + 3) === "![[";
    const isLink =
      !isEmbed && state.src.slice(state.pos, state.pos + 2) === "[[";
    if (!isEmbed && !isLink) return false;

    const startPos = state.pos;
    const openLen = isEmbed ? 3 : 2;
    const contentStart = startPos + openLen;

    const closePos = state.src.indexOf("]]", contentStart);
    if (closePos === -1 || closePos > state.posMax) return false;

    const nextOpen = state.src.indexOf("[[", contentStart);
    if (nextOpen !== -1 && nextOpen < closePos) return false;

    const rawInner = state.src.slice(contentStart, closePos);
    if (rawInner.includes("\n")) return false;

    const trimmedInner = rawInner.trim();
    if (!trimmedInner) return false;

    if (silent) {
      state.pos = closePos + 2;
      return true;
    }

    // Split target vs display parts
    const pipeIdx = trimmedInner.indexOf("|");
    const targetPart =
      pipeIdx === -1 ? trimmedInner : trimmedInner.slice(0, pipeIdx).trim();
    const displayParts =
      pipeIdx === -1
        ? []
        : trimmedInner
            .slice(pipeIdx + 1)
            .split("|")
            .map((s) => s.trim());

    // Split target into page and anchor
    let pagePart = targetPart;
    let anchorPart = "";
    const hashIdx = targetPart.indexOf("#");
    if (hashIdx !== -1) {
      pagePart = targetPart.slice(0, hashIdx).trim();
      anchorPart = targetPart.slice(hashIdx + 1).trim();
    }

    const currentFile =
      state.env && (state.env.relativePath || state.env.path);

    // ── Embeds: ![[...]] ──
    if (isEmbed) {
      let resolved: ResolvedLink;
      if (options.resolveLink) {
        const custom = options.resolveLink(pagePart, currentFile);
        if (typeof custom === "string") {
          resolved = {
            href: custom,
            isFound: true,
            isMedia: true,
            mediaType: "image",
          };
        } else if (custom) {
          resolved = custom;
        } else {
          resolved = vault.resolve(pagePart, currentFile);
        }
      } else {
        resolved = vault.resolve(pagePart, currentFile);
      }

      let width = "";
      let height = "";
      let alt = "";

      for (const part of displayParts) {
        const dimMatch = part.match(/^(\d+)(?:x(\d+))?$/);
        if (dimMatch) {
          width = dimMatch[1];
          if (dimMatch[2]) height = dimMatch[2];
        } else if (!alt) {
          alt = part;
        }
      }
      if (!alt) alt = pagePart;

      let href = resolved.href;
      if (options.baseURL && !href.startsWith("http") && !href.startsWith(options.baseURL)) {
        href = options.baseURL.replace(/\/+$/, "") + "/" + href.replace(/^\/+/, "");
      }

      if (options.renderEmbed) {
        const customHtml = options.renderEmbed({
          target: pagePart,
          href,
          isMedia: resolved.isMedia,
          mediaType: resolved.mediaType,
          width,
          height,
          alt,
        });
        if (customHtml !== null) {
          const token = state.push("html_inline", "", 0);
          token.content = customHtml;
          state.pos = closePos + 2;
          return true;
        }
      }

      let html = "";
      if (resolved.mediaType === "video") {
        html = `<video controls src="${escapeAttr(href)}"${width ? ` width="${escapeAttr(width)}"` : ""}${height ? ` height="${escapeAttr(height)}"` : ""} class="obsidian-embed obsidian-video"></video>`;
      } else if (resolved.mediaType === "audio") {
        html = `<audio controls src="${escapeAttr(href)}" class="obsidian-embed obsidian-audio"></audio>`;
      } else if (resolved.mediaType === "pdf") {
        html = `<iframe src="${escapeAttr(href)}" width="${escapeAttr(width || "100%")}" height="${escapeAttr(height || "600")}" class="obsidian-embed obsidian-pdf"></iframe>`;
      } else if (resolved.mediaType === "note") {
        html = `<div class="obsidian-embed obsidian-note-embed"><a class="internal-link" href="${escapeAttr(href)}">${escapeHtml(alt || pagePart)}</a></div>`;
      } else {
        html = `<img src="${escapeAttr(href)}" alt="${escapeAttr(alt)}"${width ? ` width="${escapeAttr(width)}"` : ""}${height ? ` height="${escapeAttr(height)}"` : ""} class="obsidian-embed obsidian-image" />`;
      }

      const token = state.push("html_inline", "", 0);
      token.content = html;
      state.pos = closePos + 2;
      return true;
    }

    // ── Wikilinks: [[...]] ──
    let anchorSlug = "";
    if (anchorPart) {
      anchorSlug = slugifyHeading(anchorPart);
    }

    let href = "";
    let isFound = true;

    if (pagePart) {
      let resolved: ResolvedLink;
      if (options.resolveLink) {
        const custom = options.resolveLink(pagePart, currentFile);
        if (typeof custom === "string") {
          resolved = { href: custom, isFound: true, isMedia: false, mediaType: "note" };
        } else if (custom) {
          resolved = custom;
        } else {
          resolved = vault.resolve(pagePart, currentFile);
        }
      } else {
        resolved = vault.resolve(pagePart, currentFile);
      }

      isFound = resolved.isFound;
      let baseHref = resolved.href;
      if (options.baseURL && !baseHref.startsWith("http") && !baseHref.startsWith(options.baseURL)) {
        baseHref = options.baseURL.replace(/\/+$/, "") + "/" + baseHref.replace(/^\/+/, "");
      }
      if (options.uriSuffix && !baseHref.endsWith(options.uriSuffix)) {
        baseHref += options.uriSuffix;
      }
      href = anchorSlug ? `${baseHref}#${anchorSlug}` : baseHref;
    } else if (anchorSlug) {
      href = `#${anchorSlug}`;
    } else {
      href = "#";
    }

    let displayText = displayParts.join("|");
    if (!displayText) {
      if (pagePart && anchorPart) {
        displayText = `${pagePart} > ${anchorPart}`;
      } else if (anchorPart) {
        displayText = `#${anchorPart}`;
      } else {
        displayText = pagePart;
      }
    }

    if (options.postProcessLabel) {
      displayText = options.postProcessLabel(displayText);
    }

    const linkOpen = state.push("link_open", "a", 1);
    linkOpen.attrSet("href", href);
    linkOpen.attrSet(
      "class",
      isFound ? "internal-link" : "internal-link is-unresolved"
    );
    if (!isFound) {
      linkOpen.attrSet("title", `Unresolved link: ${pagePart}`);
    }

    if (options.htmlAttributes) {
      for (const [key, value] of Object.entries(options.htmlAttributes)) {
        linkOpen.attrSet(key, value);
      }
    }

    const textToken = state.push("text", "", 0);
    textToken.content = displayText;

    state.push("link_close", "a", -1);
    state.pos = closePos + 2;
    return true;
  });
}

export default obsidianWikilinksPlugin;
