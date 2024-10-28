import {
  RESET,
  CREATE_USER,
  CREATE_SYMBOL,
  GET_ORDERBOOK,
  GET_INR_BALANCES,
  GET_STOCK_BALANCES,
  GET_USER_INR_BALANCE,
  GET_USER_STOCK_BALANCE,
  ONRAMP_INR,
  GET_STOCK_ORDERBOOK,
  BUY_ORDER,
  SELL_ORDER,
  CANCEL_ORDER,
} from "./index";

export type MessageToEngine = {
  type: typeof RESET;
  data:
    | {}
    | {
        type: typeof CREATE_USER;
        data: {
          userId: string;
        };
      }
    | {
        type: typeof CREATE_SYMBOL;
        data: {
          symbol: string;
        };
      }
    | {
        type: typeof GET_ORDERBOOK;
        data: {};
      }
    | {
        type: typeof GET_INR_BALANCES;
        data: {};
      }
    | {
        type: typeof GET_STOCK_BALANCES;
        data: {};
      }
    | {
        type: typeof GET_USER_INR_BALANCE;
        data: {
          userId: string;
        };
      }
    | {
        type: typeof GET_USER_STOCK_BALANCE;
        data: {
          userId: string;
        };
      }
    | {
        type: typeof ONRAMP_INR;
        data: {};
      }
    | {
        type: typeof GET_STOCK_ORDERBOOK;
        data: {
          symbol: string;
        };
      }
    | {
        type: typeof BUY_ORDER;
        data: {};
      }
    | {
        type: typeof SELL_ORDER;
        data: {};
      }
    | {
        type: typeof CANCEL_ORDER;
        data: {};
      };
};
