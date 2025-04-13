import accountsReducer, {
  addAccount,
  updateAccount,
  deleteAccount,
  selectAccounts,
  selectAccountById
} from '../../src/lib/redux/features/accounts/accountsSlice';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

describe('accounts reducer', () => {
  const initialState = {
    accounts: []
  };

  it('should handle initial state', () => {
    expect(accountsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('addAccount', () => {
    it('should add a new account with generated id', () => {
      const newAccount = {
        ownerId: 123,
        currency: 'USD',
        balance: 1000
      };
      
      const action = addAccount(newAccount);
      const state = accountsReducer(initialState, action);
      
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0]).toEqual({
        ...newAccount,
        id: 'test-uuid'
      });
    });
  });

  describe('updateAccount', () => {
    it('should update an existing account', () => {
      let state = accountsReducer(
        initialState,
        addAccount({ ownerId: 123, currency: 'USD', balance: 1000 })
      );
      
      const updatedAccount = {
        id: 'test-uuid',
        ownerId: 123,
        currency: 'EUR',
        balance: 2000
      };
      
      state = accountsReducer(state, updateAccount(updatedAccount));
      
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0]).toEqual(updatedAccount);
    });

    it('should not update account if id does not exist', () => {
      let state = accountsReducer(
        initialState,
        addAccount({ ownerId: 123, currency: 'USD', balance: 1000 })
      );
      
      const nonExistentAccount = {
        id: 'non-existent-id',
        ownerId: 456,
        currency: 'EUR',
        balance: 2000
      };
      
      state = accountsReducer(state, updateAccount(nonExistentAccount));
      
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toEqual('test-uuid');
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account by id', () => {
      let state = accountsReducer(
        initialState,
        addAccount({ ownerId: 123, currency: 'USD', balance: 1000 })
      );
      
      expect(state.accounts).toHaveLength(1);
      
      state = accountsReducer(state, deleteAccount('test-uuid'));
      
      expect(state.accounts).toHaveLength(0);
    });

    it('should not delete account if id does not exist', () => {
      let state = accountsReducer(
        initialState,
        addAccount({ ownerId: 123, currency: 'USD', balance: 1000 })
      );
      
      state = accountsReducer(state, deleteAccount('non-existent-id'));
      
      expect(state.accounts).toHaveLength(1);
    });
  });

  describe('selectors', () => {
    it('selectAccounts should return all accounts', () => {
      let state = accountsReducer(
        initialState,
        addAccount({ ownerId: 123, currency: 'USD', balance: 1000 })
      );
      
      jest.requireMock('uuid').v4.mockReturnValueOnce('test-uuid-2');
      
      state = accountsReducer(
        state,
        addAccount({ ownerId: 456, currency: 'EUR', balance: 2000 })
      );
      
      const accounts = selectAccounts({ accounts: state });
      expect(accounts).toHaveLength(2);
      expect(accounts[0].id).toEqual('test-uuid');
      expect(accounts[1].id).toEqual('test-uuid-2');
    });

    it('selectAccountById should return account by id', () => {
      const state = accountsReducer(
        initialState,
        addAccount({ ownerId: 123, currency: 'USD', balance: 1000 })
      );
      
      const account = selectAccountById({ accounts: state }, 'test-uuid');
      expect(account).toEqual({
        id: 'test-uuid',
        ownerId: 123,
        currency: 'USD',
        balance: 1000
      });
      
      const nonExistentAccount = selectAccountById({ accounts: state }, 'non-existent-id');
      expect(nonExistentAccount).toBeUndefined();
    });
  });
}); 