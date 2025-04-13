'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { selectAccounts, updateAccount, Account } from '@/lib/redux/features/accounts/accountsSlice';
import { addTransfer } from '@/lib/redux/features/transfers/transfersSlice';
import { transferFundsAction } from '@/app/actions/accountActions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { convertCurrency } from '@/lib/utils';

export default function TransferFundForm() {
  const t = useTranslations();
  const dispatch = useDispatch();
  const accounts = useSelector(selectAccounts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transferFormSchema = z.object({
    fromAccountId: z.string().min(1, { message: t('transfer.validation.fromAccountRequired') }),
    toAccountId: z.string().min(1, { message: t('transfer.validation.toAccountRequired') }),
    amount: z.string()
      .min(1, { message: t('transfer.validation.amountRequired') })
      .refine((value) => !isNaN(Number(value)), {
        message: t('transfer.validation.amountFormat'),
      })
      .refine((value) => Number(value) > 0, {
        message: t('transfer.validation.amountPositive'),
      }),
  }).refine(
    (data) => data.fromAccountId !== data.toAccountId, 
    {
      message: t('transfer.validation.sameAccount'),
      path: ['toAccountId'],
    }
  );

  type TransferFormValues = z.infer<typeof transferFormSchema>;

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: '',
    },
  });

  const onSubmit = async (data: TransferFormValues) => {
    const fromAccount = accounts.find(acc => acc.id === data.fromAccountId);
    const toAccount = accounts.find(acc => acc.id === data.toAccountId);
    const amount = Number(data.amount);
    
    if (!fromAccount || !toAccount) {
      toast.error(t('transfer.validation.accountNotFound'));
      return;
    }

    let debitAmount = amount;
    if (fromAccount.currency !== toAccount.currency) {
      debitAmount = amount;
    }

    if (fromAccount.balance < debitAmount) {
      form.setError('amount', { 
        type: 'manual', 
        message: t('transfer.validation.insufficientFunds')
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('fromAccountId', data.fromAccountId);
      formData.append('toAccountId', data.toAccountId);
      formData.append('amount', data.amount);
      
      const result = await transferFundsAction(formData);
      
      if (result.success) {
        const newFromAccount: Account = {
          ...fromAccount,
          balance: fromAccount.balance - debitAmount
        };
        
        let creditAmount = amount;
        if (fromAccount.currency !== toAccount.currency) {
          creditAmount = convertCurrency(
            amount,
            fromAccount.currency,
            toAccount.currency
          );
        }
        
        const newToAccount: Account = {
          ...toAccount,
          balance: toAccount.balance + creditAmount
        };
        
        dispatch(updateAccount(newFromAccount));
        dispatch(updateAccount(newToAccount));
        
        dispatch(addTransfer({
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          fromOwnerId: fromAccount.ownerId,
          toOwnerId: toAccount.ownerId,
          amount: amount,
          fromCurrency: fromAccount.currency,
          toCurrency: toAccount.currency,
          convertedAmount: creditAmount,
        }));
        
        form.reset();

        if (fromAccount.currency !== toAccount.currency) {
          toast.success(
            t('transfer.successConversion', {
              amount: amount,
              fromCurrency: fromAccount.currency,
              convertedAmount: creditAmount.toFixed(2),
              toCurrency: toAccount.currency
            })
          );
        } else {
          toast.success(t('transfer.success'));
        }
      } else {
        toast.error(result.error || t('transfer.error'));
      }
    } catch (error) {
      console.error('Error transferring funds:', error);
      toast.error(t('transfer.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [conversionPreview, setConversionPreview] = useState<string | null>(null);
  
  useEffect(() => {
    const fromAccountId = form.watch('fromAccountId');
    const toAccountId = form.watch('toAccountId');
    const amount = form.watch('amount');
    
    if (fromAccountId && toAccountId && amount && !isNaN(Number(amount))) {
      const fromAccount = accounts.find(acc => acc.id === fromAccountId);
      const toAccount = accounts.find(acc => acc.id === toAccountId);
      
      if (fromAccount && toAccount && fromAccount.currency !== toAccount.currency) {
        const convertedAmount = convertCurrency(
          Number(amount),
          fromAccount.currency,
          toAccount.currency
        );
        
        setConversionPreview(
          t('transfer.conversionPreview', {
            amount: Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            fromCurrency: fromAccount.currency,
            convertedAmount: convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            toCurrency: toAccount.currency
          })
        );
      } else {
        setConversionPreview(null);
      }
    } else {
      setConversionPreview(null);
    }
  }, [form.watch('fromAccountId'), form.watch('toAccountId'), form.watch('amount'), accounts, t]);

  return (
    <Card className="w-full shadow-md h-full">
      <CardHeader className="text-center md:text-left pb-2">
        <CardTitle>{t('transfer.title')}</CardTitle>
        <CardDescription>{t('app.description')}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">{t('transfer.form.fromAccount')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || accounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full text-sm sm:text-base">
                        <SelectValue placeholder={t('transfer.form.fromAccount')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="text-sm sm:text-base">
                          {`ID: ${account.ownerId} (${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${account.currency})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs sm:text-sm">
                    {fieldState.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">{t('transfer.form.toAccount')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || accounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full text-sm sm:text-base">
                        <SelectValue placeholder={t('transfer.form.toAccount')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="text-sm sm:text-base">
                          {`ID: ${account.ownerId} (${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${account.currency})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs sm:text-sm">
                    {fieldState.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">{t('transfer.form.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0.01"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full text-sm sm:text-base"
                      placeholder={t('transfer.form.amountPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm">
                    {fieldState.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {conversionPreview && (
              <div className="p-2 sm:p-3 bg-muted rounded-md text-xs sm:text-sm">
                {conversionPreview}
              </div>
            )}

            <div className="pt-2 sm:pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || accounts.length < 2} 
                className="w-full"
              >
                {isSubmitting ? t('common.loading') : t('transfer.form.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 