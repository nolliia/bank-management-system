import React from 'react';
import { screen, fireEvent, within, waitFor } from '../test-utils';
import { render } from '../test-utils';
import AccountList from '@/components/account-list';
import { Account } from '@/lib/redux/features/accounts/accountsSlice';
import * as accountActions from '@/app/actions/accountActions';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/app/actions/accountActions', () => ({
  deleteAccountAction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAccounts: Account[] = [
  { id: '1', ownerId: 101, currency: 'USD', balance: 1000.00 },
  { id: '2', ownerId: 102, currency: 'EUR', balance: 500.00 },
  { id: '3', ownerId: 103, currency: 'USD', balance: 1500.00 },
];

describe('AccountList Component', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the account list correctly', () => {
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });

    expect(screen.getByText('accounts.listTitle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('accounts.search')).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByText('accounts.ownerId')).toBeInTheDocument();
    expect(within(table).getByText('accounts.currency')).toBeInTheDocument();
    expect(within(table).getByText('accounts.balance')).toBeInTheDocument();
    expect(within(table).getByText('accounts.table.actions')).toBeInTheDocument();

    expect(screen.getAllByText('101').length).toBeGreaterThan(0);
    expect(screen.getAllByText('USD').length).toBeGreaterThan(0);
    expect(screen.getAllByText((content) => content.startsWith('1,000')).length).toBeGreaterThan(0); 
    expect(screen.getAllByText('102').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EUR').length).toBeGreaterThan(0);
    expect(screen.getAllByText((content) => content.startsWith('500')).length).toBeGreaterThan(0);
  });

  it('filters accounts by owner ID', async () => {
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });

    const searchInput = screen.getByPlaceholderText('accounts.search');
    const searchSelectTrigger = screen.getByRole('combobox');

    fireEvent.click(searchSelectTrigger);

    const listbox = await screen.findByRole('listbox');
    const ownerIdOption = within(listbox).getByText('accounts.searchFields.ownerId');
    fireEvent.click(ownerIdOption);
    
    fireEvent.change(searchInput, { target: { value: '101' } });

    expect(screen.getAllByText('101').length).toBeGreaterThan(0);
    expect(screen.queryByText('102')).not.toBeInTheDocument();
    expect(screen.queryByText('103')).not.toBeInTheDocument();
  });
  
  it('filters accounts by currency', async () => {
    render(<AccountList />, {
        preloadedState: {
            accounts: { accounts: mockAccounts, status: 'idle', error: null },
        },
    });

    const searchInput = screen.getByPlaceholderText('accounts.search');
    const searchSelectTrigger = screen.getByRole('combobox');

    fireEvent.click(searchSelectTrigger);

    const listbox = await screen.findByRole('listbox');
    const currencyOption = within(listbox).getByText('accounts.searchFields.currency');
    fireEvent.click(currencyOption);

    fireEvent.change(searchInput, { target: { value: 'USD' } });

    expect(screen.getAllByText('101').length).toBeGreaterThan(0);
    expect(screen.queryByText('102')).not.toBeInTheDocument();
    expect(screen.getAllByText('103').length).toBeGreaterThan(0);
  });

  it('clears the search query', () => {
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });

    const searchInput = screen.getByPlaceholderText('accounts.search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: '101' } });
    expect(searchInput.value).toBe('101');
    expect(screen.queryByText('102')).not.toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /accounts.clearSearch/i });
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
    expect(screen.getAllByText('101').length).toBeGreaterThan(0);
    expect(screen.getAllByText('102').length).toBeGreaterThan(0);
    expect(screen.getAllByText('103').length).toBeGreaterThan(0);
  });

  it('opens the delete confirmation dialog when delete button is clicked', () => {
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });

    const deleteButtons = screen.getAllByRole('button', { name: /accounts.delete/i });
    fireEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('accounts.delete')).toBeInTheDocument();
    expect(within(dialog).getByText('accounts.deleteConfirmation')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /common.cancel/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /common.delete/i })).toBeInTheDocument();
  });

  it('calls the delete action and shows success toast on successful deletion', async () => {
    const mockDeleteAction = accountActions.deleteAccountAction as jest.Mock;
    mockDeleteAction.mockResolvedValue({ success: true });

    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });

    const deleteButtons = screen.getAllByRole('button', { name: /accounts.delete/i });
    fireEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole('alertdialog');
    const confirmDeleteButton = within(dialog).getByRole('button', { name: /common.delete/i });
    fireEvent.click(confirmDeleteButton);
    
    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(require('sonner').toast.success).toHaveBeenCalledWith('accounts.deleteSuccess');
    });
  });

  it('shows error toast on failed deletion', async () => {
    const mockDeleteAction = accountActions.deleteAccountAction as jest.Mock;
    const errorMessage = 'Server Error: Deletion failed';
    mockDeleteAction.mockResolvedValue({ success: false, error: errorMessage });
  
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });
  
    const deleteButtons = screen.getAllByRole('button', { name: /accounts.delete/i });
    fireEvent.click(deleteButtons[0]);
  
    const dialog = screen.getByRole('alertdialog');
    const confirmDeleteButton = within(dialog).getByRole('button', { name: /common.delete/i });
    fireEvent.click(confirmDeleteButton);
  
    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith('1');
    });
  
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('opens the edit form when edit button is clicked', () => {
     render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });

    const editButtons = screen.getAllByRole('button', { name: /accounts.edit/i });
    fireEvent.click(editButtons[0]);

    const editDialog = screen.getByRole('dialog');
    expect(editDialog).toBeInTheDocument(); 
    expect(within(editDialog).getByText('accounts.edit')).toBeInTheDocument(); 
  });

  it('renders no accounts message when the list is empty', () => {
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: [], status: 'idle', error: null },
      },
    });
  
    expect(screen.getByText('accounts.noAccounts')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument(); 
  });

  it('renders no search results message when filter yields no accounts', () => {
    render(<AccountList />, {
      preloadedState: {
        accounts: { accounts: mockAccounts, status: 'idle', error: null },
      },
    });
  
    const searchInput = screen.getByPlaceholderText('accounts.search');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
  
    expect(screen.getAllByText('accounts.noSearchResults').length).toBeGreaterThan(0);
    
    expect(screen.queryByText('101')).not.toBeInTheDocument();
  });

});
