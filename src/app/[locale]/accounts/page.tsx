'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AccountList from '@/components/account-list';
import CreateAccountForm from '@/components/create-account-form';
import { Button } from '@/components/ui/button';

export default function AccountsPage() {
  const t = useTranslations();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            {t('accounts.create')}
          </Button>
        </div>
      </div>
      
      <AccountList />
      
      <CreateAccountForm 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 