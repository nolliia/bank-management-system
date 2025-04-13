import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/index';

export default function Home() {
  redirect(`/${defaultLocale}`);
}
