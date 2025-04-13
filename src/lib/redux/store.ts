import { configureStore } from '@reduxjs/toolkit';
import accountsReducer from './features/accounts/accountsSlice';
import transfersReducer from './features/transfers/transfersSlice';

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    transfers: transfersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 