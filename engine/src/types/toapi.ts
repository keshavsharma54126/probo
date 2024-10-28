export type MessageToApi =
  | {
      type: "RESET";
      payload: {
        ORDERBOOK: {};
        INR_BALANCES: {};
        STOCK_BALANCES: {};
      };
    }
  | {
      type: "CREATE_USER";
      payload: {
        userId: string;
      };
    };
