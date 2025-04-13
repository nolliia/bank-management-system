import transfersReducer, {
  addTransfer,
  selectTransfers,
  selectTransfersByAccount
} from '../../src/lib/redux/features/transfers/transfersSlice';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-transfer-uuid')
}));

const mockTimestamp = 1612345678900;
const originalDateNow = Date.now;

describe('transfers reducer', () => {
  const initialState = {
    transfers: []
  };

  beforeAll(() => {
    global.Date.now = jest.fn(() => mockTimestamp);
  });

  afterAll(() => {
    global.Date.now = originalDateNow;
  });

  it('should handle initial state', () => {
    expect(transfersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('addTransfer', () => {
    it('should add a new transfer with generated id and timestamp', () => {
      const newTransfer = {
        fromAccountId: 'account1',
        toAccountId: 'account2',
        fromOwnerId: 123,
        toOwnerId: 456,
        amount: 1000,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        convertedAmount: 850,
      };
      
      const action = addTransfer(newTransfer);
      const state = transfersReducer(initialState, action);
      
      expect(state.transfers).toHaveLength(1);
      expect(state.transfers[0]).toEqual({
        ...newTransfer,
        id: 'test-transfer-uuid',
        timestamp: mockTimestamp
      });
    });
  });

  describe('selectors', () => {
    it('selectTransfers should return all transfers', () => {
      const state = transfersReducer(
        initialState,
        addTransfer({
          fromAccountId: 'account1',
          toAccountId: 'account2',
          fromOwnerId: 123,
          toOwnerId: 456,
          amount: 1000,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          convertedAmount: 850,
        })
      );
      
      const transfers = selectTransfers({ transfers: state });
      expect(transfers).toHaveLength(1);
      expect(transfers[0].id).toEqual('test-transfer-uuid');
    });

    it('selectTransfersByAccount should return transfers for a specific account', () => {
      let state = transfersReducer(
        initialState,
        addTransfer({
          fromAccountId: 'account1',
          toAccountId: 'account2',
          fromOwnerId: 123,
          toOwnerId: 456,
          amount: 1000,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          convertedAmount: 850,
        })
      );
      
      jest.requireMock('uuid').v4.mockReturnValueOnce('test-transfer-uuid-2');
      
      state = transfersReducer(
        state,
        addTransfer({
          fromAccountId: 'account3',
          toAccountId: 'account1',
          fromOwnerId: 789,
          toOwnerId: 123,
          amount: 500,
          fromCurrency: 'GBP',
          toCurrency: 'USD',
          convertedAmount: 650,
        })
      );
      
      const account1Transfers = selectTransfersByAccount({ transfers: state }, 'account1');
      expect(account1Transfers).toHaveLength(2);
      
      const account2Transfers = selectTransfersByAccount({ transfers: state }, 'account2');
      expect(account2Transfers).toHaveLength(1);
      expect(account2Transfers[0].id).toEqual('test-transfer-uuid');
      
      const account3Transfers = selectTransfersByAccount({ transfers: state }, 'account3');
      expect(account3Transfers).toHaveLength(1);
      expect(account3Transfers[0].id).toEqual('test-transfer-uuid-2');
      
      const nonExistentAccountTransfers = selectTransfersByAccount({ transfers: state }, 'non-existent');
      expect(nonExistentAccountTransfers).toHaveLength(0);
    });
  });
}); 