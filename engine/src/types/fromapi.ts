export const RESET = "RESET";
export const CREATE_USER = "CREATE_USER";
export const CREATE_SYMBOL = "CREATE_SYMBOL";
export const GET_ORDERBOOK = "GET_ORDERBOOK";
export const GET_INR_BALANCES = "GET_INR_BALANCES";
export const GET_STOCK_BALANCES = "GET_STOCK_BALANCES";
export const GET_USER_INR_BALANCE = "GET_USER_INR_BALANCE";
export const GET_USER_STOCK_BALANCE = "GET_USER_STOCK_BALANCE";
export const ONRAMP_INR = "ONRAMP_INR";
export const GET_STOCK_ORDERBOOK = "GET_STOCK_ORDERBOOK";
export const BUY_ORDER = "BUY_ORDER";
export const SELL_ORDER = "SELL_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";

export type MessageFromApi =
  | {
      type: typeof RESET;
      data: {};
    }
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
