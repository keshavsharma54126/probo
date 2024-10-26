export type MessageFromClient = {
  type: "buy" | "sell";
  payload: {
    stockSymbol: string;
    quantity: number;
    price: number;
  };
};
