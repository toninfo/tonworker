/** Ton 品牌色点缀：描边、文字、左条 — 避免大面积红色底（与 approval-primary 同一思路）。 */

export const BTN_ACCENT =
  "text-[12.5px] px-3 py-1.5 rounded-lg border border-accent text-accent bg-panel font-semibold shrink-0 hover:bg-accentSoft disabled:opacity-40 disabled:hover:bg-panel";

export const BTN_ACCENT_SM =
  "text-[12px] px-2.5 py-1.5 rounded-lg border border-accent text-accent bg-panel font-semibold shrink-0 hover:bg-accentSoft disabled:opacity-40";

export const BTN_ACCENT_MD =
  "text-[12px] px-2.5 py-1.5 rounded-lg border border-accent text-accent bg-panel font-semibold shrink-0 hover:bg-accentSoft";

export const PILL_ACCENT =
  "text-[12.5px] font-medium px-3 py-1.5 rounded-full border border-accent text-accent bg-panel shrink-0 hover:bg-accentSoft disabled:opacity-50";

/** 侧栏「新建会话」容器：左 accent 条 + 细描边，无红底 */
export const NEW_SESSION_SHELL =
  "flex rounded-lg overflow-hidden border border-line border-l-[3px] border-l-accent";

export const NEW_SESSION_PRIMARY =
  "newsplit-primary flex-1 text-left px-3 py-2 bg-panel text-accent text-[13px] font-semibold hover:bg-accentSoft flex items-center gap-2";

export const NEW_SESSION_CHEVRON =
  "px-2.5 bg-panel text-accent border-l border-line hover:bg-accentSoft flex items-center";
