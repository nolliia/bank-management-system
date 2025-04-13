import React from 'react';
import { render, screen, within } from '../test-utils';
import TransferHistory from '@/components/transfer-history';
import { Account } from '@/lib/redux/features/accounts/accountsSlice';
import { Transfer } from '@/lib/redux/features/transfers/transfersSlice';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => 
    params ? `${key} ${JSON.stringify(params)}` : key,
}));


const mockAccountUSD: Account = { id: 'acc-usd-1', ownerId: 101, currency: 'USD', balance: 1000 };
const mockAccountEUR: Account = { id: 'acc-eur-1', ownerId: 102, currency: 'EUR', balance: 500 };
const mockAccountGBP: Account = { id: 'acc-gbp-1', ownerId: 103, currency: 'GBP', balance: 200 };

const mockTransfer1: Transfer = {
  id: 't1',
  fromAccountId: mockAccountUSD.id,
  toAccountId: mockAccountEUR.id,
  fromOwnerId: mockAccountUSD.ownerId,
  toOwnerId: mockAccountEUR.ownerId,
  amount: 100,
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  convertedAmount: 92,
  timestamp: 1700000000000,
};

const mockTransfer2: Transfer = {
  id: 't2',
  fromAccountId: mockAccountEUR.id,
  toAccountId: mockAccountUSD.id,
  fromOwnerId: mockAccountEUR.ownerId,
  toOwnerId: mockAccountUSD.ownerId,
  amount: 50,
  fromCurrency: 'EUR',
  toCurrency: 'USD',
  convertedAmount: 54,
  timestamp: 1700000500000,
};

const mockTransferSameCurrency: Transfer = {
  id: 't3',
  fromAccountId: mockAccountUSD.id,
  toAccountId: mockAccountGBP.id,
  fromOwnerId: mockAccountUSD.ownerId,
  toOwnerId: mockAccountGBP.ownerId,
  amount: 25,
  fromCurrency: 'USD',
  toCurrency: 'USD',
  convertedAmount: 25,
  timestamp: 1700000200000,
};

const mockTransferUnknownTo: Transfer = {
  id: 't4',
  fromAccountId: mockAccountUSD.id,
  toAccountId: 'unknown-acc-id',
  fromOwnerId: mockAccountUSD.ownerId,
  toOwnerId: 999,
  amount: 10,
  fromCurrency: 'USD',
  toCurrency: 'XYZ',
  convertedAmount: 8,
  timestamp: 1700001000000,
};

const mockAccounts = [mockAccountUSD, mockAccountEUR, mockAccountGBP];
const mockTransfers = [mockTransfer1, mockTransfer2, mockTransferSameCurrency, mockTransferUnknownTo];

const basePreloadedState = {
  accounts: { accounts: mockAccounts, status: 'idle', error: null },
  transfers: { transfers: mockTransfers, status: 'idle', error: null },
};

describe('TransferHistory Component', () => {
  it('renders title and description', () => {
    render(<TransferHistory />, { preloadedState: basePreloadedState });
    expect(screen.getByText('transfer.history.title')).toBeInTheDocument();
    expect(screen.getByText('transfer.history.description')).toBeInTheDocument();
  });

  it('renders "no transfers" message when transfers list is empty', () => {
    const emptyState = {
      accounts: { accounts: mockAccounts, status: 'idle', error: null },
      transfers: { transfers: [], status: 'idle', error: null },
    };
    render(<TransferHistory />, { preloadedState: emptyState });
    expect(screen.getByText('transfer.history.noTransfers')).toBeInTheDocument();
    expect(screen.queryByText(/ID:/i)).not.toBeInTheDocument(); 
  });

  it('renders transfers sorted by timestamp (newest first)', () => {
    render(<TransferHistory />, { preloadedState: basePreloadedState });

    const dateBadges = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    
    const expectedTimestamps = [ 
      mockTransferUnknownTo.timestamp,
      mockTransfer2.timestamp,
      mockTransferSameCurrency.timestamp,
      mockTransfer1.timestamp 
    ].map(ts => new Date(ts).toLocaleString());

    expect(dateBadges).toHaveLength(mockTransfers.length);
    dateBadges.forEach((badge, index) => {
      expect(badge).toHaveTextContent(expectedTimestamps[index]);
    });
  });

  it('displays correct details for a transfer (different currencies)', () => {
    render(<TransferHistory />, { preloadedState: basePreloadedState });

    const transferCardElement = screen.getByTestId(`transfer-card-${mockTransfer2.id}`);

    expect(within(transferCardElement).getByText(`ID: ${mockTransfer2.fromOwnerId} (${mockTransfer2.fromCurrency})`)).toBeInTheDocument();
    expect(within(transferCardElement).getByText(`ID: ${mockTransfer2.toOwnerId} (${mockTransfer2.toCurrency})`)).toBeInTheDocument();
    expect(within(transferCardElement).getByText(`${mockTransfer2.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${mockTransfer2.fromCurrency}`)).toBeInTheDocument();
    expect(within(transferCardElement).getByText(new RegExp('transfer.history.converted', 'i'))).toBeInTheDocument();
    expect(within(transferCardElement).getByText(`${mockTransfer2.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${mockTransfer2.toCurrency}`)).toBeInTheDocument();
  });

  it('displays correct details for a transfer (same currency)', () => {
    render(<TransferHistory />, { preloadedState: basePreloadedState });

    const transferCardElement = screen.getByTestId(`transfer-card-${mockTransferSameCurrency.id}`);

    expect(within(transferCardElement).getByText(`ID: ${mockTransferSameCurrency.fromOwnerId} (${mockTransferSameCurrency.fromCurrency})`)).toBeInTheDocument();
    expect(within(transferCardElement).getByText(`ID: ${mockTransferSameCurrency.toOwnerId} (${mockAccountGBP.currency})`)).toBeInTheDocument();
    expect(within(transferCardElement).getByText(`${mockTransferSameCurrency.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${mockTransferSameCurrency.fromCurrency}`)).toBeInTheDocument();
    expect(within(transferCardElement).queryByText(new RegExp('transfer.history.converted', 'i'))).not.toBeInTheDocument();
  });

  it('displays "unknown account" if account ID is not found', () => {
    render(<TransferHistory />, { preloadedState: basePreloadedState });

    const transferCardElement = screen.getByTestId(`transfer-card-${mockTransferUnknownTo.id}`);

    expect(within(transferCardElement).getByText(`ID: ${mockTransferUnknownTo.fromOwnerId} (${mockTransferUnknownTo.fromCurrency})`)).toBeInTheDocument();
    expect(within(transferCardElement).getByText('transfer.history.unknownAccount')).toBeInTheDocument();
  });

}); 