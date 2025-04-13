import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Account {
  id: string;
  ownerId: number;
  currency: string;
  balance: number;
}

interface AccountsState {
  accounts: Account[];
}

const initialState: AccountsState = {
  accounts: [],
};

export const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    addAccount: (state, action: PayloadAction<Omit<Account, 'id'>>) => {
      const newAccount = {
        ...action.payload,
        id: uuidv4(),
      };
      state.accounts.push(newAccount);
    },
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.accounts.findIndex(account => account.id === action.payload.id);
      if (index !== -1) {
        state.accounts[index] = action.payload;
      }
    },
    deleteAccount: (state, action: PayloadAction<string>) => {
      state.accounts = state.accounts.filter(account => account.id !== action.payload);
    },
  },
});

export const { addAccount, updateAccount, deleteAccount } = accountsSlice.actions;

export const selectAccounts = (state: { accounts: AccountsState }) => state.accounts.accounts;
export const selectAccountById = (state: { accounts: AccountsState }, id: string) => 
  state.accounts.accounts.find(account => account.id === id);

export default accountsSlice.reducer; 