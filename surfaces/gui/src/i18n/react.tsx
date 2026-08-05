/**
 * React 绑定：locale 变化时触发订阅组件重渲染。
 */
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getLocale,
  setLocale,
  subscribeLocale,
  t as translate,
  tn as translateN,
  type Locale,
} from "./index";

type I18nApi = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translate;
  tn: typeof translateN;
};

const I18nContext = createContext<I18nApi | null>(null);

function useLocaleStore(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, () => "zh" as Locale);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore();
  const api = useMemo<I18nApi>(
    () => ({
      locale,
      setLocale,
      t: translate,
      tn: translateN,
    }),
    [locale],
  );
  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nApi {
  const ctx = useContext(I18nContext);
  // 无 Provider 时仍可用模块级 t（不随 locale 热更新）
  const locale = useLocaleStore();
  return (
    ctx ?? {
      locale,
      setLocale,
      t: translate,
      tn: translateN,
    }
  );
}
