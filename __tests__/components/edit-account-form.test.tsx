import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../test-utils';
import EditAccountForm from '@/components/edit-account-form';
import * as accountActions from '@/app/actions/accountActions';
import { Account } from '@/lib/redux/features/accounts/accountsSlice';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => 
    params ? `${key} ${JSON.stringify(params)}` : key,
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('@/app/actions/accountActions', () => ({
  updateAccountAction: jest.fn(),
}));
  
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockOnOpenChange = jest.fn();

const mockAccountToEdit: Account = {
  id: 'acc-1',
  ownerId: 101,
  currency: 'USD',
  balance: 1500.50,
};

const otherExistingAccount: Account = {
  id: 'acc-2',
  ownerId: 202,
  currency: 'EUR',
  balance: 500,
};

describe('EditAccountForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (accountActions.updateAccountAction as jest.Mock).mockReset();
  });

  const renderComponent = (account: Account | null, preloadedState = {}) => {
    render(
      <EditAccountForm account={account} open={true} onOpenChange={mockOnOpenChange} />,
      { preloadedState }
    );
  };

  it('renders the form pre-populated with account data', () => {
    renderComponent(mockAccountToEdit, {
      accounts: { accounts: [mockAccountToEdit, otherExistingAccount], status: 'idle', error: null }
    });

    expect(screen.getByText('accounts.edit')).toBeInTheDocument();
    expect(screen.getByLabelText('accounts.form.ownerId')).toHaveValue(mockAccountToEdit.ownerId.toString());
    expect(screen.getByRole('combobox', { name: 'accounts.form.currency' })).toHaveTextContent(mockAccountToEdit.currency);
    expect(screen.getByLabelText('accounts.form.balance')).toHaveValue(mockAccountToEdit.balance);
  });

  it('renders the dialog structure even if account prop is null', () => {
    renderComponent(null, {
      accounts: { accounts: [], status: 'idle', error: null }
    });
    expect(screen.getByText('accounts.edit')).toBeInTheDocument();
    const ownerIdInput = screen.queryByLabelText('accounts.form.ownerId');
    if (ownerIdInput) {
       expect(ownerIdInput).toHaveValue('');
    } else {
       expect(ownerIdInput).not.toBeInTheDocument();
    }
  });

  it('shows validation errors for empty required fields', async () => {
    renderComponent(mockAccountToEdit, {
        accounts: { accounts: [mockAccountToEdit], status: 'idle', error: null }
      });

    fireEvent.change(screen.getByLabelText('accounts.form.ownerId'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('accounts.form.balance'), { target: { value: '' } });
    
    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.ownerIdRequired')).toBeInTheDocument();
      expect(screen.getByText('accounts.validation.balanceRequired')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid owner ID format', async () => {
     renderComponent(mockAccountToEdit, {
        accounts: { accounts: [mockAccountToEdit], status: 'idle', error: null }
      });
    
    fireEvent.change(screen.getByLabelText('accounts.form.ownerId'), { target: { value: 'abc' } });

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.ownerIdFormat')).toBeInTheDocument();
    });
  });
  
  it('shows validation error for negative balance', async () => {
    renderComponent(mockAccountToEdit, {
        accounts: { accounts: [mockAccountToEdit], status: 'idle', error: null }
      });
    
    fireEvent.change(screen.getByLabelText('accounts.form.balance'), { target: { value: '-100' } });

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.balancePositive')).toBeInTheDocument();
    });
  });

  it('shows validation error for duplicate owner ID (against other accounts)', async () => {
    renderComponent(mockAccountToEdit, {
      accounts: { accounts: [mockAccountToEdit, otherExistingAccount], status: 'idle', error: null },
    });

    const ownerIdInput = screen.getByLabelText('accounts.form.ownerId');
    const saveButton = screen.getByRole('button', { name: 'common.save' });

    fireEvent.change(ownerIdInput, { target: { value: otherExistingAccount.ownerId.toString() } });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.ownerIdDuplicate')).toBeInTheDocument();
    });
    expect(accountActions.updateAccountAction).not.toHaveBeenCalled();
  });

  it('allows saving with the original owner ID (no duplicate error)', async () => {
     (accountActions.updateAccountAction as jest.Mock).mockResolvedValue({ 
       success: true, 
       data: { ...mockAccountToEdit }
     });

     renderComponent(mockAccountToEdit, {
      accounts: { accounts: [mockAccountToEdit, otherExistingAccount], status: 'idle', error: null },
    });

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
       expect(accountActions.updateAccountAction).toHaveBeenCalled();
    });

    expect(screen.queryByText('accounts.validation.ownerIdDuplicate')).not.toBeInTheDocument();
    
    await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
        expect(require('sonner').toast.success).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('submits the form successfully with updated data', async () => {
    const updatedData = {
      ownerId: '101',
      currency: 'EUR',
      balance: '2000',
    };
    const mockUpdatedAccountResult: Omit<Account, 'id'> = {
      ownerId: Number(updatedData.ownerId),
      currency: updatedData.currency,
      balance: Number(updatedData.balance),
    };

    (accountActions.updateAccountAction as jest.Mock).mockResolvedValue({ 
      success: true, 
      data: mockUpdatedAccountResult
    });

    renderComponent(mockAccountToEdit, {
      accounts: { accounts: [mockAccountToEdit, otherExistingAccount], status: 'idle', error: null },
    });

    const currencySelect = screen.getByRole('combobox', { name: 'accounts.form.currency' });
    const balanceInput = screen.getByLabelText('accounts.form.balance');
    const saveButton = screen.getByRole('button', { name: 'common.save' });

    fireEvent.change(balanceInput, { target: { value: updatedData.balance } });

    fireEvent.click(currencySelect);
    const listbox = await screen.findByRole('listbox');
    const eurOption = within(listbox).getByText('EUR');
    fireEvent.click(eurOption);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(accountActions.updateAccountAction).toHaveBeenCalledTimes(1);
      expect((accountActions.updateAccountAction as jest.Mock).mock.calls[0][1]).toBe(mockAccountToEdit.id);
      
      const formData = (accountActions.updateAccountAction as jest.Mock).mock.calls[0][0] as FormData;
      expect(formData.get('ownerId')).toBe(updatedData.ownerId);
      expect(formData.get('currency')).toBe(updatedData.currency);
      expect(formData.get('balance')).toBe(updatedData.balance);
    });
    
    await waitFor(() => {
       expect(require('sonner').toast.success).toHaveBeenCalledWith('accounts.updateSuccess');
    });
   
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ 
          type: 'accounts/updateAccount',
          payload: { ...mockUpdatedAccountResult, id: mockAccountToEdit.id } 
      }));
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error toast if update action fails', async () => {
    const errorMessage = 'Failed to update';
    (accountActions.updateAccountAction as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: errorMessage
    });

    renderComponent(mockAccountToEdit, {
      accounts: { accounts: [mockAccountToEdit], status: 'idle', error: null },
    });

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(accountActions.updateAccountAction).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
       expect(require('sonner').toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  it('calls onOpenChange(false) when cancel button is clicked', () => {
     renderComponent(mockAccountToEdit, {
        accounts: { accounts: [mockAccountToEdit], status: 'idle', error: null }
      });
    
    const cancelButton = screen.getByRole('button', { name: 'common.cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

}); 