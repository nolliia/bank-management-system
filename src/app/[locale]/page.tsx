'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const t = useTranslations();
  
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-8 sm:py-16 px-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-center">{t('app.title')}</h1>
      <p className="text-base sm:text-lg text-center max-w-xl mb-8 sm:mb-12 text-muted-foreground">{t('app.description')}</p>
      
      <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row w-full max-w-xs sm:max-w-md">
        <Link href="/accounts" className="w-full">
          <Button size="lg" className="w-full py-6 text-lg">
            {t('header.accounts')}
          </Button>
        </Link>
        <Link href="/transfer" className="w-full">
          <Button size="lg" variant="outline" className="w-full py-6 text-lg">
            {t('header.transfer')}
          </Button>
        </Link>
      </div>
    </div>
  );
} 