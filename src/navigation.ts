import { createNavigation } from 'next-intl/navigation';
import { locales } from './i18n/index';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation({
  locales,
  pathnames: {
    '/': '/',
    '/accounts': '/accounts', 
    '/transfer': '/transfer'
  }
}); 