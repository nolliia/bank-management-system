'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createAccountSchema = z.object({
  ownerId: z.string()
    .min(1, { message: 'accounts.validation.ownerIdRequired' })
    .refine((value) => !isNaN(Number(value)), {
      message: 'accounts.validation.ownerIdFormat',
    }),
  currency: z.string().min(1, { message: 'accounts.validation.currencyRequired' }),
  balance: z.string()
    .min(1, { message: 'accounts.validation.balanceRequired' })
    .refine((value) => !isNaN(Number(value)), {
      message: 'accounts.validation.balanceFormat',
    })
    .refine((value) => Number(value) >= 0, {
      message: 'accounts.validation.balancePositive',
    }),
});

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AccountData {
  ownerId: number;
  currency: string;
  balance: number;
}

export async function createAccountAction(formData: FormData): Promise<ActionResult<AccountData>> {
  try {
    const rawData = {
      ownerId: formData.get('ownerId')?.toString() || '',
      currency: formData.get('currency')?.toString() || '',
      balance: formData.get('balance')?.toString() || ''
    };

    const validationResult = createAccountSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid form data'
      };
    }

    const data = {
      ownerId: Number(rawData.ownerId),
      currency: rawData.currency,
      balance: Number(rawData.balance)
    };

    revalidatePath('/accounts');
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating account:', error);
    return {
      success: false,
      error: 'Failed to create account'
    };
  }
}

export async function updateAccountAction(formData: FormData, accountId: string): Promise<ActionResult<AccountData>> {
  try {
    const rawData = {
      ownerId: formData.get('ownerId')?.toString() || '',
      currency: formData.get('currency')?.toString() || '',
      balance: formData.get('balance')?.toString() || ''
    };

    const validationResult = createAccountSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid form data'
      };
    }

    const data = {
      ownerId: Number(rawData.ownerId),
      currency: rawData.currency,
      balance: Number(rawData.balance)
    };

    revalidatePath('/accounts');
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating account:', error);
    return {
      success: false,
      error: 'Failed to update account'
    };
  }
}

export async function deleteAccountAction(accountId: string): Promise<ActionResult<void>> {
  try {
    revalidatePath('/accounts');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    return {
      success: false,
      error: 'Failed to delete account'
    };
  }
}

export interface TransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export async function transferFundsAction(formData: FormData): Promise<ActionResult<{ fromAccount: AccountData, toAccount: AccountData }>> {
  try {
    const fromAccountId = formData.get('fromAccountId')?.toString() || '';
    const toAccountId = formData.get('toAccountId')?.toString() || '';
    const amount = formData.get('amount')?.toString() || '';

    if (!fromAccountId || !toAccountId || !amount) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return {
        success: false,
        error: 'Amount must be a positive number'
      };
    }

    const result = {
      fromAccount: {
        ownerId: 0,
        currency: '',
        balance: 0
      },
      toAccount: {
        ownerId: 0,
        currency: '',
        balance: 0
      }
    };

    revalidatePath('/accounts');
    revalidatePath('/transfer');
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error transferring funds:', error);
    return {
      success: false,
      error: 'Failed to transfer funds'
    };
  }
} 