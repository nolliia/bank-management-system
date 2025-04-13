import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromOwnerId: number;
  toOwnerId: number;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  timestamp: number;
}

interface TransfersState {
  transfers: Transfer[];
}

const initialState: TransfersState = {
  transfers: [],
};

export const transfersSlice = createSlice({
  name: 'transfers',
  initialState,
  reducers: {
    addTransfer: (state, action: PayloadAction<Omit<Transfer, 'id' | 'timestamp'>>) => {
      const newTransfer = {
        ...action.payload,
        id: uuidv4(),
        timestamp: Date.now(),
      };
      state.transfers.push(newTransfer);
    },
  },
});

export const { addTransfer } = transfersSlice.actions;

export const selectTransfers = (state: { transfers: TransfersState }) => state.transfers.transfers;
export const selectTransfersByAccount = (state: { transfers: TransfersState }, accountId: string) => 
  state.transfers.transfers.filter(
    transfer => transfer.fromAccountId === accountId || transfer.toAccountId === accountId
  );

export default transfersSlice.reducer; 