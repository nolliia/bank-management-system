'use client';

import { useTranslations } from 'next-intl';
import { useSelector } from 'react-redux';
import { selectTransfers, Transfer } from '@/lib/redux/features/transfers/transfersSlice';
import { selectAccounts } from '@/lib/redux/features/accounts/accountsSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function TransferHistory() {
  const t = useTranslations();
  const transfers = useSelector(selectTransfers);
  const accounts = useSelector(selectAccounts);

  const sortedTransfers = [...transfers].sort((a, b) => b.timestamp - a.timestamp);

  const getAccountInfo = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `ID: ${account.ownerId} (${account.currency})` : t('transfer.history.unknownAccount');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="w-full shadow-md h-full">
      <CardHeader className="text-center md:text-left pb-2">
        <CardTitle>{t('transfer.history.title')}</CardTitle>
        <CardDescription>{t('transfer.history.description')}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {sortedTransfers.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {t('transfer.history.noTransfers')}
          </p>
        ) : (
          <ScrollArea className="h-[350px] md:h-[400px] pr-2">
            <div className="space-y-3">
              {sortedTransfers.map((transfer) => (
                <Card 
                  key={transfer.id} 
                  className="p-3 bg-muted/30" 
                  data-testid={`transfer-card-${transfer.id}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs sm:text-sm">
                          {formatDate(transfer.timestamp)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                          {t('transfer.history.from')}:
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {getAccountInfo(transfer.fromAccountId)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                          {t('transfer.history.to')}:
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {getAccountInfo(transfer.toAccountId)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                          {t('transfer.history.amount')}:
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {transfer.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transfer.fromCurrency}
                        </p>
                      </div>
                      
                      {transfer.fromCurrency !== transfer.toCurrency && (
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            {t('transfer.history.converted')}:
                          </p>
                          <p className="text-sm sm:text-base font-medium">
                            {transfer.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transfer.toCurrency}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 