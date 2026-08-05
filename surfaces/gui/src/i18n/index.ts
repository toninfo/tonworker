/**
 * 轻量 i18n：英文源文案作 key（gettext 风格），默认中文。
 * 测试 / 切回英文时 setLocale("en")，未收录的 key 原样回退。
 */

import { zh } from "./locales/zh";

export type Locale = "zh" | "en";

const STORAGE_KEY = "openworker.locale";

type Vars = Record<string, string | number>;

let locale: Locale = readInitialLocale();
const listeners = new Set<() => void>();

function readInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    /* SSR / 非浏览器 */
  }
  // 全面汉化：默认中文
  return "zh";
}

/** 订阅语言变更（供 React 强制重渲染） */
export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

/**
 * 插值：`t("Inbox — {n} items", { n: 3 })`
 * 缺省变量保留占位符。
 */
function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`,
  );
}

export function t(message: string, vars?: Vars): string {
  const raw = locale === "zh" ? zh[message] ?? message : message;
  return interpolate(raw, vars);
}

/** 复数简易助手：中文通常不需要形态变化，但保留 n 插值 */
export function tn(one: string, other: string, n: number, vars?: Vars): string {
  const msg = n === 1 ? one : other;
  return t(msg, { n, ...vars });
}
