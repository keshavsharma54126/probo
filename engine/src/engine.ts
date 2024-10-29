import fs from "fs";
import { RedisManager } from "./redisManager";
import * as fromapi from "./types/fromapi";
import * as toapi from "./types/toapi";
interface INR_BALANCES {
  [key: string]: {
    balance: number;
    locked: number;
  };
}
interface OrderDetails {
  total: number;
  orders: {
    [userId: string]: number;
  };
}

interface OrderSide {
  [price: string]: OrderDetails;
}

interface Symbol {
  yes: OrderSide;
  no: OrderSide;
}

interface ORDERBOOK {
  [symbol: string]: Symbol;
}

interface STOCK_BALANCES {
  [key: string]: {
    [key: string]: {
      quantity: number;
      locked: number;
    };
  };
}

let INR_BALANCES: INR_BALANCES = {
  //   user1: {
  //     balance: 10,
  //     locked: 0,
  //   },
  //   user2: {
  //     balance: 20,
  //     locked: 10,
  //   },
};

let ORDERBOOK: any = {
  //   BTC_USDT_10_Oct_2024_9_30: {
  //     yes: {
  //       "9.5": {
  //         total: 12,
  //         orders: {
  //           user1: 10,
  //           user2: 2,
  //         },
  //       },
  //       "8.5": {
  //         total: 12,
  //         orders: {
  //           user1: 3,
  //           user2: 6,
  //           user3: 3,
  //         },
  //       },
  //     },
  //     no: {
  //       "7.5": {
  //         total: 12,
  //         orders: {
  //           user1: 3,
  //           user2: 2,
  //           user3: 7,
  //         },
  //       },
  //     },
  //   },
};

let STOCK_BALANCES: any = {
  //   user1: {
  //     BTC_USDT_10_Oct_2024_9_30: {
  //       yes: {
  //         quantity: 1,
  //         locked: 0,
  //       },
  //     },
  //   },
  //   user2: {
  //     BTC_USDT_10_Oct_2024_9_30: {
  //       no: {
  //         quantity: 3,
  //         locked: 4,
  //       },
  //     },
  //   },
};

export class Engine {
  private ORDERBOOK: ORDERBOOK = {};
  private INR_BALANCES: INR_BALANCES = {};
  private STOCK_BALANCES: STOCK_BALANCES = {};

  constructor() {
    let snapshot = null;
    try {
      snapshot = fs.readFileSync("./snapshot.json");
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) {
      const snapshotSnapshot = JSON.parse(snapshot.toString());
      this.ORDERBOOK = snapshotSnapshot.ORDERBOOK;
      this.INR_BALANCES = snapshotSnapshot.INR_BALANCES;
      this.STOCK_BALANCES = snapshotSnapshot.STOCK_BALANCES;
    } else {
      this.ORDERBOOK = {};
      this.INR_BALANCES = {};
      this.STOCK_BALANCES = {};
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 3000);
  }

  saveSnapshot() {
    const snapshotSnapshot = {
      ORDERBOOK: this.ORDERBOOK,
      INR_BALANCES: this.INR_BALANCES,
      STOCK_BALANCES: this.STOCK_BALANCES,
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
  }

  process({
    message,
    clientId,
  }: {
    message: fromapi.MessageFromApi;
    clientId: string;
  }) {
    const { type, data } = message;
    switch (type) {
      case fromapi.RESET:
        this.reset(clientId);
        break;
      case fromapi.CREATE_USER:
        this.createUser(data, clientId);
        break;
      case fromapi.CREATE_SYMBOL:
        this.createSymbol(data, clientId);
        break;
      case fromapi.GET_ORDERBOOK:
        this.getOrderbook(clientId);
        break;
      case fromapi.GET_INR_BALANCES:
        this.getInrBalances(clientId);
        break;
      case fromapi.GET_STOCK_BALANCES:
        this.getStockBalances(clientId);
        break;
      case fromapi.GET_USER_INR_BALANCE:
        this.getUserInrBalance(data, clientId);
        break;
      case fromapi.ONRAMP_INR:
        this.onrampInr(data, clientId);
        break;
      case fromapi.GET_USER_STOCK_BALANCE:
        this.getUserStockBalance(data, clientId);
        break;
      case fromapi.GET_STOCK_ORDERBOOK:
        this.getStockOrderbook(data, clientId);
        break;
      //   case fromapi.BUY_ORDER:
      //     this.buyOrder(data, clientId);
      //     break;
      //   case fromapi.SELL_ORDER:
      //     this.sellOrder(data, clientId);
      //     break;
    }
  }

  // Add all the endpoint methods
  reset(clientId: string) {
    try {
      this.ORDERBOOK = {};
      this.INR_BALANCES = {};
      this.STOCK_BALANCES = {};
      RedisManager.getInstance().sendToApi(clientId, {
        type: toapi.RESET,
        payload: {
          ORDERBOOK: this.ORDERBOOK,
          INR_BALANCES: this.INR_BALANCES,
          STOCK_BALANCES: this.STOCK_BALANCES,
        },
      });
    } catch (e) {
      console.log("could not reset the variables in the engine", e);
      RedisManager.getInstance().sendToApi(clientId, {
        type: toapi.RESET,
        payload: {
          ORDERBOOK: this.ORDERBOOK,
          INR_BALANCES: this.INR_BALANCES,
          STOCK_BALANCES: this.STOCK_BALANCES,
        },
      });
    }
  }

  createUser({ userId }: { userId: string }, clientId: string) {
    if (this.INR_BALANCES[userId]) {
      RedisManager.getInstance().sendToApi(clientId, {
        type: "CREATE_USER",
        payload: { message: "user already exists" },
      });
      return;
    }

    this.INR_BALANCES[userId] = { balance: 0, locked: 0 };
    RedisManager.getInstance().sendToApi(clientId, {
      type: "CREATE_USER",
      payload: {
        message: `User ${userId} created`,
        INR_BALANCES: this.INR_BALANCES,
      },
    });
  }

  createSymbol({ symbol }: { symbol: string }, clientId: string) {
    if (this.ORDERBOOK[symbol]) {
      RedisManager.getInstance().sendToApi(clientId, {
        type: toapi.CREATE_SYMBOL,
        payload: { message: "symbol already present" },
      });
      return;
    }

    this.ORDERBOOK[symbol] = { yes: {}, no: {} };
    RedisManager.getInstance().sendToApi(clientId, {
      type: toapi.CREATE_SYMBOL,
      payload: {
        message: `Symbol ${symbol} created`,
        ORDERBOOK: this.ORDERBOOK,
      },
    });
  }

  getOrderbook(clientId: string) {
    RedisManager.getInstance().sendToApi(clientId, {
      type: "GET_ORDERBOOK",
      payload: { ORDERBOOK: this.ORDERBOOK },
    });
  }

  getInrBalances(clientId: string) {
    RedisManager.getInstance().sendToApi(clientId, {
      type: "GET_INR_BALANCES",
      payload: { INR_BALANCES: this.INR_BALANCES },
    });
    RedisManager.getInstance().publishMessage("inr_balances", {
      type: "GET_INR_BALANCES",
      payload: { INR_BALANCES: this.INR_BALANCES },
    });
  }

  getStockBalances(clientId: string) {
    RedisManager.getInstance().sendToApi(clientId, {
      type: "GET_STOCK_BALANCES",
      payload: { STOCK_BALANCES: this.STOCK_BALANCES },
    });
  }

  getUserInrBalance({ userId }: { userId: string }, clientId: string) {
    if (!this.INR_BALANCES[userId]) {
      RedisManager.getInstance().sendToApi(clientId, {
        type: "GET_USER_INR_BALANCE",
        payload: { message: "user not found" },
      });

      return;
    }

    RedisManager.getInstance().sendToApi(clientId, {
      type: "GET_USER_INR_BALANCE",
      payload: {
        userId: userId,
        balance: this.INR_BALANCES[userId],
      },
    });
  }

  onrampInr(
    { userId, amount }: { userId: string; amount: number },
    clientId: string
  ) {
    if (!this.INR_BALANCES[userId]) {
      RedisManager.getInstance().sendToApi(clientId, {
        type: "ONRAMP_INR",
        payload: { message: "user not found haa haa" },
      });

      return;
    }

    this.INR_BALANCES[userId].balance += amount;
    RedisManager.getInstance().sendToApi(clientId, {
      type: "ONRAMP_INR",
      payload: { message: `Onramped ${userId} with amount ${amount}` },
    });
  }

  getUserStockBalance({ userId }: { userId: string }, clientId: string) {
    if (!this.STOCK_BALANCES[userId]) {
      this.STOCK_BALANCES[userId] = {};
      RedisManager.getInstance().sendToApi(clientId, {
        type: "GET_USER_STOCK_BALANCE",
        payload: this.STOCK_BALANCES[userId],
      });
      return;
    }

    RedisManager.getInstance().sendToApi(clientId, {
      type: "GET_USER_STOCK_BALANCE",
      payload: this.STOCK_BALANCES[userId],
    });
  }

  getStockOrderbook({ symbol }: { symbol: string }, clientId: string) {
    if (!this.ORDERBOOK[symbol]) {
      RedisManager.getInstance().sendToApi(clientId, {
        type: "GET_STOCK_ORDERBOOK",
        payload: { message: `${symbol} not found in order book` },
      });
      return;
    }

    RedisManager.getInstance().sendToApi(clientId, {
      type: "GET_STOCK_ORDERBOOK",
      payload: { symbol: symbol, orderbook: this.ORDERBOOK[symbol] },
    });
  }

  // Helper method for sorting orderbook
  private sortOrderBook(stockSymbol: string, type: string) {
    const sortSide = this.ORDERBOOK[stockSymbol][type];
    const sortedKeys = Object.keys(sortSide)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .reduce(
        (
          acc: {
            [key: string]: { orders: { [key: string]: number }; total: number };
          },
          price
        ) => {
          acc[price] = sortSide[price];
          return acc;
        },
        {} as {
          [key: string]: { orders: { [key: string]: number }; total: number };
        }
      );
    this.ORDERBOOK[stockSymbol][type] = sortedKeys;
  }

  //   // Add these methods to the Engine class

  //   private matchWithSide(
  //     side: OrderSide,
  //     remainingQuantity: number,
  //     price: number,
  //     userId: string,
  //     stockSymbol: string,
  //     type: string,
  //     isPseudo: boolean
  //   ): number {
  //     for (const orderPrice in side) {
  //       if (
  //         (isPseudo && parseInt(orderPrice) === price) ||
  //         (!isPseudo && parseInt(orderPrice) <= price)
  //       ) {
  //         const availableOrders = side[orderPrice];
  //         let quantityToMatch = Math.min(
  //           remainingQuantity,
  //           availableOrders.total
  //         );

  //         remainingQuantity -= quantityToMatch;

  //         // Update user's balance and stock
  //         if (!isPseudo) {
  //           if (!this.INR_BALANCES[userId]) {
  //             console.error(`User ${userId} not found in INR_BALANCES`);
  //             return remainingQuantity;
  //           }
  //           this.INR_BALANCES[userId].locked -=
  //             quantityToMatch * parseInt(orderPrice);
  //           if (!this.STOCK_BALANCES[userId]) this.STOCK_BALANCES[userId] = {};
  //           if (!this.STOCK_BALANCES[userId][stockSymbol])
  //             this.STOCK_BALANCES[userId][stockSymbol] = {
  //               yes: { quantity: 0, locked: 0 },
  //               no: { quantity: 0, locked: 0 },
  //             };
  //           this.STOCK_BALANCES[userId][stockSymbol][type].quantity +=
  //             quantityToMatch;
  //         }

  //         while (quantityToMatch > 0) {
  //           for (const sellerId in availableOrders.orders) {
  //             const sellerQuantity = availableOrders.orders[sellerId];
  //             const matchedQuantity = Math.min(sellerQuantity, quantityToMatch);

  //             // Update seller's balance and stock
  //             if (sellerId.startsWith("pseudo")) {
  //               const realSellerId = sellerId.replace("pseudo", "");
  //               if (!this.INR_BALANCES[realSellerId]) {
  //                 console.error(`User ${realSellerId} not found in INR_BALANCES`);
  //                 continue;
  //               }
  //               this.INR_BALANCES[realSellerId].locked -=
  //                 matchedQuantity * parseInt(orderPrice);
  //               if (!this.STOCK_BALANCES[realSellerId])
  //                 this.STOCK_BALANCES[realSellerId] = {};
  //               if (!this.STOCK_BALANCES[realSellerId][stockSymbol])
  //                 this.STOCK_BALANCES[realSellerId][stockSymbol] = {
  //                   yes: { quantity: 0, locked: 0 },
  //                   no: { quantity: 0, locked: 0 },
  //                 };
  //               this.STOCK_BALANCES[realSellerId][stockSymbol][
  //                 type === "yes" ? "no" : "yes"
  //               ].quantity += matchedQuantity;
  //             } else {
  //               if (!this.INR_BALANCES[sellerId]) {
  //                 console.error(`User ${sellerId} not found in INR_BALANCES`);
  //                 continue;
  //               }
  //               this.INR_BALANCES[sellerId].balance +=
  //                 matchedQuantity * parseInt(orderPrice);
  //               if (!this.STOCK_BALANCES[sellerId]?.[stockSymbol]) {
  //                 console.error(
  //                   `Stock balance not found for user ${sellerId} and symbol ${stockSymbol}`
  //                 );
  //                 continue;
  //               }
  //               this.STOCK_BALANCES[sellerId][stockSymbol][type].locked -=
  //                 matchedQuantity;
  //             }

  //             // Update order quantities
  //             availableOrders.orders[sellerId] -= matchedQuantity;
  //             availableOrders.total -= matchedQuantity;
  //             quantityToMatch -= matchedQuantity;

  //             if (availableOrders.orders[sellerId] <= 0) {
  //               delete availableOrders.orders[sellerId];
  //             }

  //             if (quantityToMatch <= 0) break;
  //           }
  //         }

  //         if (availableOrders.total <= 0) {
  //           delete side[orderPrice];
  //         }
  //       }
  //     }
  //     return remainingQuantity;
  //   }

  //   buyOrder(
  //     {
  //       userId,
  //       stockSymbol,
  //       quantity,
  //       price,
  //       type,
  //     }: {
  //       userId: string;
  //       stockSymbol: string;
  //       quantity: number;
  //       price: number;
  //       type: string;
  //     },
  //     clientId: string
  //   ) {
  //     try {
  //       if (!this.INR_BALANCES[userId]) {
  //         RedisManager.getInstance().sendToApi(clientId, {
  //           type: "BUY_ORDER",
  //           payload: { message: "User not found" },
  //         });
  //         return;
  //       }

  //       if (!this.ORDERBOOK[stockSymbol]) {
  //         RedisManager.getInstance().sendToApi(clientId, {
  //           type: "BUY_ORDER",
  //           payload: { message: `Market for ${stockSymbol} does not exist` },
  //         });
  //         return;
  //       }

  //       const totalCost = quantity * price;
  //       if (this.INR_BALANCES[userId].balance < totalCost) {
  //         RedisManager.getInstance().sendToApi(clientId, {
  //           type: "BUY_ORDER",
  //           payload: { message: "Insufficient balance" },
  //         });
  //         return;
  //       }

  //       // Lock the funds
  //       this.INR_BALANCES[userId].balance -= totalCost;
  //       this.INR_BALANCES[userId].locked += totalCost;

  //       let remainingQuantity = quantity;

  //       // Try to match with existing orders
  //       remainingQuantity = this.matchWithSide(
  //         this.ORDERBOOK[stockSymbol][type],
  //         remainingQuantity,
  //         price,
  //         userId,
  //         stockSymbol,
  //         type,
  //         false
  //       );

  //       // If there's remaining quantity, place a new order
  //       if (remainingQuantity > 0) {
  //         const buySide =
  //           type === "yes"
  //             ? this.ORDERBOOK[stockSymbol].yes
  //             : this.ORDERBOOK[stockSymbol].no;

  //         if (!buySide[price]) {
  //           buySide[price] = { total: 0, orders: {} };
  //         }
  //         buySide[price].orders[userId] = remainingQuantity;
  //         buySide[price].total += remainingQuantity;
  //       }

  //       // Sort the order book
  //       this.sortOrderBook(stockSymbol, "yes");
  //       this.sortOrderBook(stockSymbol, "no");

  //       RedisManager.getInstance().sendToApi(clientId, {
  //         type: "BUY_ORDER",
  //         payload: {
  //           message: `Buy order placed for ${quantity} ${type} at price ${price}`,
  //           ORDERBOOK: this.ORDERBOOK,
  //           STOCK_BALANCES: this.STOCK_BALANCES,
  //           INR_BALANCES: this.INR_BALANCES,
  //         },
  //       });
  //     } catch (err) {
  //       console.error(err);
  //       RedisManager.getInstance().sendToApi(clientId, {
  //         type: "BUY_ORDER",
  //         payload: { message: "Failed to process buy order" },
  //       });
  //     }
  //   }

  //   sellOrder(
  //     {
  //       userId,
  //       stockSymbol,
  //       quantity,
  //       price,
  //       type,
  //     }: {
  //       userId: string;
  //       stockSymbol: string;
  //       quantity: number;
  //       price: number;
  //       type: string;
  //     },
  //     clientId: string
  //   ) {
  //     try {
  //       if (
  //         !this.STOCK_BALANCES[userId] ||
  //         !this.STOCK_BALANCES[userId][stockSymbol] ||
  //         !this.STOCK_BALANCES[userId][stockSymbol][type]
  //       ) {
  //         RedisManager.getInstance().sendToApi(clientId, {
  //           type: "SELL_ORDER",
  //           payload: { message: "User does not have stock to sell" },
  //         });
  //         return;
  //       }

  //       const userStock = this.STOCK_BALANCES[userId][stockSymbol][type];
  //       if (userStock.quantity < quantity) {
  //         RedisManager.getInstance().sendToApi(clientId, {
  //           type: "SELL_ORDER",
  //           payload: { message: "Insufficient stock to sell" },
  //         });
  //         return;
  //       }

  //       // Lock stock for the sell order
  //       userStock.quantity -= quantity;
  //       userStock.locked += quantity;

  //       if (!this.ORDERBOOK[stockSymbol]) {
  //         RedisManager.getInstance().sendToApi(clientId, {
  //           type: "SELL_ORDER",
  //           payload: { message: `Market for ${stockSymbol} does not exist` },
  //         });
  //         return;
  //       }

  //       const capPrice = 1000; // This should be configurable
  //       const newPrice = capPrice - price;
  //       const buySide =
  //         type === "yes"
  //           ? this.ORDERBOOK[stockSymbol].no
  //           : this.ORDERBOOK[stockSymbol].yes;

  //       let remainingQuantity = quantity;

  //       if (buySide[newPrice] && buySide[newPrice].orders) {
  //         const pseudoOrders = Object.keys(buySide[newPrice].orders).filter(
  //           (orderId) => orderId.startsWith("pseudo")
  //         );

  //         for (const pseudoOrderId of pseudoOrders) {
  //           if (remainingQuantity <= 0) break;

  //           const pseudoUserId = pseudoOrderId.split("pseudo")[1];
  //           const pseudoQuantity = buySide[newPrice].orders[pseudoOrderId];
  //           const matchedQuantity = Math.min(remainingQuantity, pseudoQuantity);

  //           // Update seller's balance
  //           this.INR_BALANCES[userId].balance += matchedQuantity * price;

  //           // Update pseudo buyer's stock balance
  //           if (!this.STOCK_BALANCES[pseudoUserId]) {
  //             this.STOCK_BALANCES[pseudoUserId] = {};
  //           }
  //           if (!this.STOCK_BALANCES[pseudoUserId][stockSymbol]) {
  //             this.STOCK_BALANCES[pseudoUserId][stockSymbol] = {
  //               yes: { quantity: 0, locked: 0 },
  //               no: { quantity: 0, locked: 0 },
  //             };
  //           }
  //           this.STOCK_BALANCES[pseudoUserId][stockSymbol][type].quantity +=
  //             matchedQuantity;

  //           // Release pseudo buyer's locked funds
  //           this.INR_BALANCES[pseudoUserId].locked -= matchedQuantity * newPrice;

  //           // Update order book
  //           buySide[newPrice].orders[pseudoOrderId] -= matchedQuantity;
  //           buySide[newPrice].total -= matchedQuantity;
  //           if (buySide[newPrice].orders[pseudoOrderId] <= 0) {
  //             delete buySide[newPrice].orders[pseudoOrderId];
  //           }

  //           remainingQuantity -= matchedQuantity;
  //         }

  //         // Remove the price level if no orders remain
  //         if (buySide[newPrice].total <= 0) {
  //           delete buySide[newPrice];
  //         }
  //       }

  //       // Place a new sell order for the remaining quantity
  //       if (remainingQuantity > 0) {
  //         const sellSide =
  //           type === "yes"
  //             ? this.ORDERBOOK[stockSymbol].yes
  //             : this.ORDERBOOK[stockSymbol].no;
  //         if (!sellSide[price]) {
  //           sellSide[price] = { total: 0, orders: {} };
  //         }
  //         sellSide[price].orders[userId] = remainingQuantity;
  //         sellSide[price].total += remainingQuantity;
  //       }

  //       // Sort the order book
  //       this.sortOrderBook(stockSymbol, "yes");
  //       this.sortOrderBook(stockSymbol, "no");

  //       RedisManager.getInstance().sendToApi(clientId, {
  //         type: "SELL_ORDER",
  //         payload: {
  //           message:
  //             remainingQuantity === 0
  //               ? `Sell order fully matched for ${quantity} ${type} at price ${price}`
  //               : `Sell order placed for ${remainingQuantity} ${type} at price ${price}`,
  //           ORDERBOOK: this.ORDERBOOK,
  //           STOCK_BALANCES: this.STOCK_BALANCES,
  //           INR_BALANCES: this.INR_BALANCES,
  //         },
  //       });
  //     } catch (err) {
  //       console.error(err);
  //       RedisManager.getInstance().sendToApi(clientId, {
  //         type: "SELL_ORDER",
  //         payload: { message: "Failed to process sell order" },
  //       });
  //     }
  //   }
}
