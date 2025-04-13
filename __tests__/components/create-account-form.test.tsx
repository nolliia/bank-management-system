import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../test-utils';
import CreateAccountForm from '@/components/create-account-form';
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
  createAccountAction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockOnOpenChange = jest.fn();

describe('CreateAccountForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (accountActions.createAccountAction as jest.Mock).mockReset();
  });

  const renderComponent = (preloadedState = {}) => {
    render(
      <CreateAccountForm open={true} onOpenChange={mockOnOpenChange} />,
      { preloadedState }
    );
  };

  it('renders the form with default values', () => {
    renderComponent();

    expect(screen.getByText('accounts.create')).toBeInTheDocument();
    expect(screen.getByLabelText('accounts.form.ownerId')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'accounts.form.currency' })).toHaveTextContent('USD');
    expect(screen.getByLabelText('accounts.form.balance')).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    renderComponent();
    
    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.ownerIdRequired')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid owner ID format', async () => {
    renderComponent();
    
    const ownerIdInput = screen.getByLabelText('accounts.form.ownerId');
    fireEvent.change(ownerIdInput, { target: { value: 'abc' } });

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.ownerIdFormat')).toBeInTheDocument();
    });
  });

  it('shows validation error for negative balance', async () => {
    renderComponent();
    
    const balanceInput = screen.getByLabelText('accounts.form.balance');
    fireEvent.change(balanceInput, { target: { value: '-100' } });

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.balancePositive')).toBeInTheDocument();
    });
  });

  it('shows validation error for duplicate owner ID', async () => {
    const existingAccount: Account = { id: 'existing-1', ownerId: 123, currency: 'EUR', balance: 500 };
    renderComponent({
      accounts: { accounts: [existingAccount], status: 'idle', error: null },
    });

    const ownerIdInput = screen.getByLabelText('accounts.form.ownerId');
    const balanceInput = screen.getByLabelText('accounts.form.balance');
    const saveButton = screen.getByRole('button', { name: 'common.save' });

    fireEvent.change(ownerIdInput, { target: { value: '123' } });
    fireEvent.change(balanceInput, { target: { value: '100' } });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('accounts.validation.ownerIdDuplicate')).toBeInTheDocument();
    });
    expect(accountActions.createAccountAction).not.toHaveBeenCalled();
  });

  it('submits the form successfully with valid data', async () => {
    const mockNewAccount: Account = { id: 'new-1', ownerId: 456, currency: 'GBP', balance: 200 };
    (accountActions.createAccountAction as jest.Mock).mockResolvedValue({ 
      success: true, 
      data: mockNewAccount 
    });

    renderComponent();

    const ownerIdInput = screen.getByLabelText('accounts.form.ownerId');
    const currencySelect = screen.getByRole('combobox', { name: 'accounts.form.currency' });
    const balanceInput = screen.getByLabelText('accounts.form.balance');
    const saveButton = screen.getByRole('button', { name: 'common.save' });

    fireEvent.change(ownerIdInput, { target: { value: '456' } });
    fireEvent.change(balanceInput, { target: { value: '200' } });

    fireEvent.click(currencySelect);
    const listbox = await screen.findByRole('listbox');
    const gbpOption = within(listbox).getByText('GBP');
    fireEvent.click(gbpOption);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(accountActions.createAccountAction).toHaveBeenCalledTimes(1);
      const expectedFormData = new FormData();
      expectedFormData.append('ownerId', '456');
      expectedFormData.append('currency', 'GBP');
      expectedFormData.append('balance', '200');
      expect((accountActions.createAccountAction as jest.Mock).mock.calls[0][0].get('ownerId')).toBe('456');
      expect((accountActions.createAccountAction as jest.Mock).mock.calls[0][0].get('currency')).toBe('GBP');
      expect((accountActions.createAccountAction as jest.Mock).mock.calls[0][0].get('balance')).toBe('200');
    });
    
    await waitFor(() => {
       expect(require('sonner').toast.success).toHaveBeenCalledWith('accounts.form.success');
    });
   
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ 
          type: 'accounts/addAccount', 
          payload: mockNewAccount 
      }));
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    
  });

  it('calls onOpenChange(false) when cancel button is clicked', () => {
    renderComponent();
    
    const cancelButton = screen.getByRole('button', { name: 'common.cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

}); 