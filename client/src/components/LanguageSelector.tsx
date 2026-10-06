import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRouteLocale, isLocalizedPublicPath, localizePath } from '@/lib/localeRoutes';

export const languages = [
  { code: 'en', abbr: 'EN' },
  { code: 'pt', abbr: 'PT' },
  { code: 'es', abbr: 'ES' },
  { code: 'fr', abbr: 'FR' },
  { code: 'de', abbr: 'DE' },
];

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const currentLang = languages.find((l) => i18n.language?.startsWith(l.code)) || languages[0];

  const handleLanguageChange = async (langCode: string) => {
    i18n.changeLanguage(langCode);

    // Public marketing pages have a dedicated Portuguese URL (/pt/...), so
    // keep the address bar in sync with the chosen language.
    if (isLocalizedPublicPath(location)) {
      const targetLocale = langCode === 'pt' ? 'pt' : 'en';
      if (getRouteLocale(location) !== targetLocale) {
        navigate(localizePath(location, targetLocale));
      }
    }

    // Persist to backend if user is logged in
    if (user) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: langCode }),
        });
      } catch (error) {
        console.error('Failed to sync language with backend:', error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-language-selector">
          <Globe className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-auto min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {currentLang.abbr}
          </span>
          <span className="sr-only">{t('language.select')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
            data-testid={`button-lang-${lang.code}`}
          >
            <span className="w-6 text-xs font-medium text-muted-foreground">{lang.abbr}</span>
            {t(`language.${lang.code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
