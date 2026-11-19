'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  LOCALE_META,
  translateArchiveContent,
  UI_TRANSLATIONS,
  type AppLocale,
  type UiDictionary,
} from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: UiDictionary;
  tc: (text?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: UI_TRANSLATIONS.en,
  tc: (text) => text || '',
});

const STORAGE_KEY = 'fa_locale';
const localeListeners = new Set<() => void>();

function subscribeLocale(cb: () => void) {
  localeListeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    localeListeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function getClientLocaleSnapshot(): AppLocale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'id' || saved === 'en' || saved === 'nl') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

function getServerLocaleSnapshot(): AppLocale {
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
    localeListeners.forEach((cb) => cb());
  }, []);

  const tc = useCallback(
    (text?: string) => translateArchiveContent(text, locale),
    [locale]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: UI_TRANSLATIONS[locale],
      tc,
    }),
    [locale, setLocale, tc]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const locales: AppLocale[] = ['id', 'en', 'nl'];

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className={cn(
        'inline-flex items-center rounded-full border border-stone-200 bg-stone-100/90 p-0.5 text-[10px] sm:text-[11px] font-bold shrink-0',
        className
      )}
    >
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          title={LOCALE_META[loc].nativeName}
          onClick={() => setLocale(loc)}
          className={cn(
            'rounded-full px-1.5 sm:px-2 py-0.5 transition-all cursor-pointer leading-none',
            locale === loc
              ? 'bg-[#0b4a68] text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          )}
        >
          {LOCALE_META[loc].label}
        </button>
      ))}
    </div>
  );
}
