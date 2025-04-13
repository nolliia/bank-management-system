'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/language-switcher';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          {t('common.appName')}
        </Link>
        
        <button 
          onClick={toggleMenu} 
          className="md:hidden focus:outline-none"
          aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">{t('nav.dashboard')}</Button>
          </Link>
          <Link href="/accounts">
            <Button variant="ghost">{t('nav.accounts')}</Button>
          </Link>
          <Link href="/transfer">
            <Button variant="ghost">{t('nav.transfers')}</Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut"
            }}
          >
            <div className="p-2 space-y-2">
              <Link href="/" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={toggleMenu}>
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Link href="/accounts" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={toggleMenu}>
                  {t('nav.accounts')}
                </Button>
              </Link>
              <Link href="/transfer" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={toggleMenu}>
                  {t('nav.transfers')}
                </Button>
              </Link>
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}