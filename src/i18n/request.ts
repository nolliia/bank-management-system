import { getRequestConfig } from 'next-intl/server';
import '../lib/localStorage-polyfill';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || 'en';
  
  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default
  };
}); 