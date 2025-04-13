'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { updateAccount, selectAccounts, Account } from '@/lib/redux/features/accounts/accountsSlice';
import { updateAccountAction } from '@/app/actions/accountActions';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

interface EditAccountFormProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditAccountForm({ account, open, onOpenChange }: EditAccountFormProps) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const existingAccounts = useSelector(selectAccounts);

  const accountFormSchema = z.object({
    ownerId: z.string()
      .min(1, { message: t('accounts.validation.ownerIdRequired') })
      .refine((value) => !isNaN(Number(value)), {
        message: t('accounts.validation.ownerIdFormat'),
      }),
    currency: z.string().min(1, { message: t('accounts.validation.currencyRequired') }),
    balance: z.string()
      .min(1, { message: t('accounts.validation.balanceRequired') })
      .refine((value) => !isNaN(Number(value)), {
        message: t('accounts.validation.balanceFormat'),
      })
      .refine((value) => Number(value) >= 0, {
        message: t('accounts.validation.balancePositive'),
      }),
  });

  type AccountFormValues = z.infer<typeof accountFormSchema>;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      ownerId: account ? account.ownerId.toString() : '',
      currency: account ? account.currency : 'USD',
      balance: account ? account.balance.toString() : '0',
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        ownerId: account.ownerId.toString(),
        currency: account.currency,
        balance: account.balance.toString(),
      });
    }
  }, [account, form]);

  const onSubmit = async (data: AccountFormValues) => {
    if (!account) return;
    
    setIsSubmitting(true);
    
    try {
      const ownerIdExists = existingAccounts.some(
        acc => acc.ownerId === Number(data.ownerId) && acc.id !== account.id
      );
      
      if (ownerIdExists) {
        form.setError('ownerId', { 
          type: 'manual', 
          message: t('accounts.validation.ownerIdDuplicate')
        });
        setIsSubmitting(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('ownerId', data.ownerId);
      formData.append('currency', data.currency);
      formData.append('balance', data.balance);
      
      const result = await updateAccountAction(formData, account.id);
      
      if (result.success && result.data) {
        dispatch(updateAccount({
          ...result.data,
          id: account.id,
        }));
        
        onOpenChange(false);
        toast.success(t('accounts.updateSuccess'));
      } else {
        toast.error(result.error || t('accounts.updateError'));
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error(t('accounts.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">{t('accounts.edit')}</DialogTitle>
          <DialogDescription className="text-center sm:text-left">
            {t('app.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t('accounts.form.ownerId')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('accounts.form.ownerIdPlaceholder')}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t('accounts.form.currency')}</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('accounts.form.currency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage>
                    {fieldState.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t('accounts.form.balance')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('accounts.form.balancePlaceholder')}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-5">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="w-full sm:w-auto order-2 sm:order-1"
                type="button"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isSubmitting ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 