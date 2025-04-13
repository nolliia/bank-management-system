import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import TransferFundForm from '@/components/transfer-fund-form';
import TransferHistory from '@/components/transfer-history';

export const metadata: Metadata = {
  title: 'Transfer Funds',
};

export default function TransferPage() {
  const t = useTranslations();
  
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('transfer.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TransferFundForm />
        <TransferHistory />
      </div>
    </main>
  );
} 