import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../test-utils';
import TransferFundForm from '@/components/transfer-fund-form';
import * as accountActions from '@/app/actions/accountActions';
import { Account, updateAccount } from '@/lib/redux/features/accounts/accountsSlice';
import { addTransfer } from '@/lib/redux/features/transfers/transfersSlice';
import * as utils from '@/lib/utils';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    if (!params) return key;
    let result = key;
    for (const pKey in params) {
        result += ` ${pKey}:${params[pKey]}`;
    }
    return result;
  },
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('@/app/actions/accountActions', () => ({
  transferFundsAction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  convertCurrency: jest.fn(),
}));

const mockAccountUSD: Account = {
  id: 'acc-usd-1',
  ownerId: 101,
  currency: 'USD',
  balance: 1000,
};
const mockAccountEUR: Account = {
  id: 'acc-eur-1',
  ownerId: 102,
  currency: 'EUR',
  balance: 500,
};
const mockAccountUSD2: Account = {
  id: 'acc-usd-2',
  ownerId: 103,
  currency: 'USD',
  balance: 200,
};

const mockAccountsState = {
  accounts: { accounts: [mockAccountUSD, mockAccountEUR, mockAccountUSD2], status: 'idle', error: null },
  transfers: { transfers: [], status: 'idle', error: null }
};

describe('TransferFundForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (accountActions.transferFundsAction as jest.Mock).mockReset();
    (utils.convertCurrency as jest.Mock).mockImplementation(() => 0);
  });

  const renderComponent = (preloadedState = mockAccountsState) => {
    render(<TransferFundForm />, { preloadedState });
  };

  const selectAccount = async (label: string, accountTextFragment: string) => {
    const selectTrigger = screen.getByRole('combobox', { name: label });
    fireEvent.click(selectTrigger);
    const listbox = await screen.findByRole('listbox');
    const option = within(listbox).getByText(new RegExp(accountTextFragment, 'i'));
    fireEvent.click(option);
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  };

  it('renders the form with account dropdowns populated', () => {
    renderComponent();

    expect(screen.getByText('transfer.title')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'transfer.form.fromAccount' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'transfer.form.toAccount' })).toBeInTheDocument();
    expect(screen.getByLabelText('transfer.form.amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'transfer.form.submit' })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: 'transfer.form.submit' }));

    await waitFor(() => {
      expect(screen.getByText('transfer.validation.fromAccountRequired')).toBeInTheDocument();
      expect(screen.getByText('transfer.validation.toAccountRequired')).toBeInTheDocument();
      expect(screen.getByText('transfer.validation.amountRequired')).toBeInTheDocument();
    });
  });

  it('shows validation error for selecting the same account', async () => {
    renderComponent();
    await selectAccount('transfer.form.fromAccount', mockAccountUSD.ownerId.toString());
    await selectAccount('transfer.form.toAccount', mockAccountUSD.ownerId.toString());
    fireEvent.change(screen.getByLabelText('transfer.form.amount'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'transfer.form.submit' }));

    await waitFor(() => {
      expect(screen.getByText('transfer.validation.sameAccount')).toBeInTheDocument();
    });
  });

  it('shows validation error for insufficient funds', async () => {
    renderComponent();
    await selectAccount('transfer.form.fromAccount', mockAccountUSD2.ownerId.toString());
    await selectAccount('transfer.form.toAccount', mockAccountEUR.ownerId.toString());
    fireEvent.change(screen.getByLabelText('transfer.form.amount'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'transfer.form.submit' }));

    await waitFor(() => {
      expect(screen.getByText('transfer.validation.insufficientFunds')).toBeInTheDocument();
    });
  });

  it('displays conversion preview when currencies differ', async () => {
    const conversionRate = 0.92;
    const amount = 100;
    const convertedAmount = amount * conversionRate;
    (utils.convertCurrency as jest.Mock).mockReturnValue(convertedAmount);
    
    renderComponent();
    await selectAccount('transfer.form.fromAccount', mockAccountUSD.ownerId.toString());
    await selectAccount('transfer.form.toAccount', mockAccountEUR.ownerId.toString());
    fireEvent.change(screen.getByLabelText('transfer.form.amount'), { target: { value: amount.toString() } });

    await waitFor(() => {
      expect(utils.convertCurrency).toHaveBeenCalledWith(amount, mockAccountUSD.currency, mockAccountEUR.currency);
      
      const previewDiv = screen.getByText(/^transfer\.conversionPreview/i);
      expect(previewDiv).toBeInTheDocument();

      expect(previewDiv).toHaveTextContent(new RegExp(`amount:${amount}`, 'i'));
      expect(previewDiv).toHaveTextContent(new RegExp(`fromCurrency:${mockAccountUSD.currency}`, 'i'));
      expect(previewDiv).toHaveTextContent(new RegExp(`convertedAmount:${convertedAmount.toFixed(2)}`, 'i')); 
      expect(previewDiv).toHaveTextContent(new RegExp(`toCurrency:${mockAccountEUR.currency}`, 'i'));
    });
  });

  it('submits successfully for same currency transfer', async () => {
    const amountToTransfer = 50;
    (accountActions.transferFundsAction as jest.Mock).mockResolvedValue({ success: true });

    renderComponent();
    await selectAccount('transfer.form.fromAccount', mockAccountUSD.ownerId.toString());
    await selectAccount('transfer.form.toAccount', mockAccountUSD2.ownerId.toString());
    fireEvent.change(screen.getByLabelText('transfer.form.amount'), { target: { value: amountToTransfer.toString() } });

    fireEvent.click(screen.getByRole('button', { name: 'transfer.form.submit' }));

    await waitFor(() => {
      expect(accountActions.transferFundsAction).toHaveBeenCalledTimes(1);
      const formData = (accountActions.transferFundsAction as jest.Mock).mock.calls[0][0] as FormData;
      expect(formData.get('fromAccountId')).toBe(mockAccountUSD.id);
      expect(formData.get('toAccountId')).toBe(mockAccountUSD2.id);
      expect(formData.get('amount')).toBe(amountToTransfer.toString());
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(updateAccount({
        ...mockAccountUSD,
        balance: mockAccountUSD.balance - amountToTransfer,
      }));
      expect(mockDispatch).toHaveBeenCalledWith(updateAccount({
        ...mockAccountUSD2,
        balance: mockAccountUSD2.balance + amountToTransfer,
      }));
      expect(mockDispatch).toHaveBeenCalledWith(addTransfer(expect.objectContaining({
          fromAccountId: mockAccountUSD.id,
          toAccountId: mockAccountUSD2.id,
          amount: amountToTransfer,
          fromCurrency: mockAccountUSD.currency,
          toCurrency: mockAccountUSD2.currency,
          convertedAmount: amountToTransfer, 
      })));
    });

    expect(require('sonner').toast.success).toHaveBeenCalledWith('transfer.success');
    expect(screen.getByLabelText('transfer.form.amount')).toHaveValue(null);
  });

  it('submits successfully for different currency transfer', async () => {
    const amountToTransfer = 100;
    const conversionRate = 0.92;
    const convertedAmount = amountToTransfer * conversionRate;
    (accountActions.transferFundsAction as jest.Mock).mockResolvedValue({ success: true });
    (utils.convertCurrency as jest.Mock).mockReturnValue(convertedAmount);

    renderComponent();
    await selectAccount('transfer.form.fromAccount', mockAccountUSD.ownerId.toString());
    await selectAccount('transfer.form.toAccount', mockAccountEUR.ownerId.toString());
    fireEvent.change(screen.getByLabelText('transfer.form.amount'), { target: { value: amountToTransfer.toString() } });

    fireEvent.click(screen.getByRole('button', { name: 'transfer.form.submit' }));

    await waitFor(() => {
      expect(accountActions.transferFundsAction).toHaveBeenCalledTimes(1);
    });

    expect(utils.convertCurrency).toHaveBeenCalledWith(amountToTransfer, mockAccountUSD.currency, mockAccountEUR.currency);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(updateAccount({
        ...mockAccountUSD,
        balance: mockAccountUSD.balance - amountToTransfer,
      }));
      expect(mockDispatch).toHaveBeenCalledWith(updateAccount({
        ...mockAccountEUR,
        balance: mockAccountEUR.balance + convertedAmount,
      }));
      expect(mockDispatch).toHaveBeenCalledWith(addTransfer(expect.objectContaining({
          fromAccountId: mockAccountUSD.id,
          toAccountId: mockAccountEUR.id,
          amount: amountToTransfer,
          fromCurrency: mockAccountUSD.currency,
          toCurrency: mockAccountEUR.currency,
          convertedAmount: convertedAmount, 
      })));
    });

    expect(require('sonner').toast.success).toHaveBeenCalledWith(expect.stringContaining('transfer.successConversion'));
    expect(screen.getByLabelText('transfer.form.amount')).toHaveValue(null);
  });

  it('shows error toast if transfer action fails', async () => {
    const errorMessage = 'Transfer failed on server';
    (accountActions.transferFundsAction as jest.Mock).mockResolvedValue({ success: false, error: errorMessage });

    renderComponent();
    await selectAccount('transfer.form.fromAccount', mockAccountUSD.ownerId.toString());
    await selectAccount('transfer.form.toAccount', mockAccountUSD2.ownerId.toString());
    fireEvent.change(screen.getByLabelText('transfer.form.amount'), { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: 'transfer.form.submit' }));

    await waitFor(() => {
      expect(accountActions.transferFundsAction).toHaveBeenCalledTimes(1);
    });

    expect(require('sonner').toast.error).toHaveBeenCalledWith(errorMessage);

    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: updateAccount.type }));
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: addTransfer.type }));
    expect(screen.getByLabelText('transfer.form.amount')).toHaveValue(50);
  });
}); 