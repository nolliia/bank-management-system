'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { addAccount, selectAccounts } from '@/lib/redux/features/accounts/accountsSlice';
import { createAccountAction, AccountData } from '@/app/actions/accountActions';
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

interface CreateAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAccountForm({ open, onOpenChange }: CreateAccountFormProps) {
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
      ownerId: '',
      currency: 'USD',
      balance: '0',
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);
    
    try {
      const ownerIdExists = existingAccounts.some(
        account => account.ownerId === Number(data.ownerId)
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
      
      const result = await createAccountAction(formData);
      
      if (result.success && result.data) {
        dispatch(addAccount(result.data));
        
        form.reset();
        onOpenChange(false);
        toast.success(t('accounts.form.success'));
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(t('accounts.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">{t('accounts.create')}</DialogTitle>
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