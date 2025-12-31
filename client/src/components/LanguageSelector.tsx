import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', abbr: 'EN' },
  { code: 'pt', name: 'Português', abbr: 'PT' },
  { code: 'es', name: 'Español', abbr: 'ES' },
  { code: 'fr', name: 'Français', abbr: 'FR' },
  { code: 'de', name: 'Deutsch', abbr: 'DE' },
];

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const currentLang = languages.find((l) => i18n.language?.startsWith(l.code)) || languages[0];

  const handleLanguageChange = async (langCode: string) => {
    i18n.changeLanguage(langCode);

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
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
