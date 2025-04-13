'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { locales } from '@/i18n/index';
import { useRouter, usePathname } from '@/navigation';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (newLocale: string) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {locales.map((l) => (
        <Button
          key={l}
          variant={isClient && locale === l ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleChange(l)}
          disabled={!isClient || locale === l}
          className="px-2 sm:px-3"
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
} 