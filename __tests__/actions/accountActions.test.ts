import {
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
  transferFundsAction,
  ActionResult,
  AccountData
} from '@/app/actions/accountActions';
import { revalidatePath } from 'next/cache';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockRevalidateErrorOnce = () => {
  jest.mocked(revalidatePath).mockImplementationOnce(() => {
    throw new Error('Simulated revalidatePath error');
  });
};

describe('Account Server Actions', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createAccountAction', () => {
    it('should return success and data on valid input', async () => {
      const formData = new FormData();
      formData.append('ownerId', '123');
      formData.append('currency', 'USD');
      formData.append('balance', '1000');

      const result: ActionResult<AccountData> = await createAccountAction(formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({ ownerId: 123, currency: 'USD', balance: 1000 });
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
    });

    it('should return error on invalid ownerId format', async () => {
      const formData = new FormData();
      formData.append('ownerId', 'abc');
      formData.append('currency', 'USD');
      formData.append('balance', '1000');

      const result = await createAccountAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Invalid form data');
      expect(revalidatePath).not.toHaveBeenCalled();
    });
    
    it('should return error on missing currency', async () => {
      const formData = new FormData();
      formData.append('ownerId', '123');
      formData.append('balance', '1000');

      const result = await createAccountAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Invalid form data');
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error on negative balance', async () => {
      const formData = new FormData();
      formData.append('ownerId', '123');
      formData.append('currency', 'USD');
      formData.append('balance', '-100');

      const result = await createAccountAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Invalid form data');
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if revalidatePath fails', async () => {
      const formData = new FormData();
      formData.append('ownerId', '123');
      formData.append('currency', 'USD');
      formData.append('balance', '1000');

      mockRevalidateErrorOnce();

      const result = await createAccountAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Failed to create account');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('updateAccountAction', () => {
    const accountId = 'acc-test-1';

    it('should return success and data on valid input', async () => {
      const formData = new FormData();
      formData.append('ownerId', '456');
      formData.append('currency', 'EUR');
      formData.append('balance', '500');

      const result: ActionResult<AccountData> = await updateAccountAction(formData, accountId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({ ownerId: 456, currency: 'EUR', balance: 500 });
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
    });

    it('should return error on invalid data', async () => {
      const formData = new FormData();
      formData.append('ownerId', 'abc');
      formData.append('currency', 'EUR');
      formData.append('balance', '500');

      const result = await updateAccountAction(formData, accountId);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Invalid form data');
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if revalidatePath fails', async () => {
      const formData = new FormData();
      formData.append('ownerId', '456');
      formData.append('currency', 'EUR');
      formData.append('balance', '500');

      mockRevalidateErrorOnce();

      const result = await updateAccountAction(formData, accountId);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Failed to update account');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('deleteAccountAction', () => {
    it('should return success and revalidate path', async () => {
      const accountId = 'acc-to-delete';
      const result: ActionResult<void> = await deleteAccountAction(accountId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeUndefined();
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
    });

    it('should return error if revalidatePath fails', async () => {
      const accountId = 'acc-to-delete';
      
      mockRevalidateErrorOnce();

      const result = await deleteAccountAction(accountId);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Failed to delete account');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('transferFundsAction', () => {
    it('should return success on valid input', async () => {
      const formData = new FormData();
      formData.append('fromAccountId', 'acc-1');
      formData.append('toAccountId', 'acc-2');
      formData.append('amount', '100');

      const result = await transferFundsAction(formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
      expect(revalidatePath).toHaveBeenCalledWith('/transfer');
    });

    it('should return error if required fields are missing', async () => {
      const formData = new FormData();
      formData.append('fromAccountId', 'acc-1');

      const result = await transferFundsAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Missing required fields');
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error for non-positive amount', async () => {
      const formData = new FormData();
      formData.append('fromAccountId', 'acc-1');
      formData.append('toAccountId', 'acc-2');
      formData.append('amount', '0');

      const result = await transferFundsAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Amount must be a positive number');
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error for invalid amount format', async () => {
      const formData = new FormData();
      formData.append('fromAccountId', 'acc-1');
      formData.append('toAccountId', 'acc-2');
      formData.append('amount', 'abc');

      const result = await transferFundsAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Amount must be a positive number');
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if revalidatePath fails', async () => {
      const formData = new FormData();
      formData.append('fromAccountId', 'acc-1');
      formData.append('toAccountId', 'acc-2');
      formData.append('amount', '100');

      mockRevalidateErrorOnce();

      const result = await transferFundsAction(formData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Failed to transfer funds');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts'); 
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
}); 