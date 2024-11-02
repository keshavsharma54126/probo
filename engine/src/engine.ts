import fs from "fs";
import { RedisManager } from "./redisManager";
import * as fromapi from "./types/fromapi";
import * as toapi from "./types/toapi";

interface UserBalance {
  balance: number;
  locked: number;
}

interface INR_BALANCES {
  [userId: string]: UserBalance;
}

interface Order {
  total: number;
  orders: {
    [userId: string]: number;
  };
}

interface OrderSide {
  [price: string]: Order;
}

interface Symbol {
  yes: OrderSide;
  no: OrderSide;
}

interface ORDERBOOK {
  [symbol: string]: Symbol;
}

interface Stock {
  quantity: number;
  locked: number;
}

interface UserStock {
  yes: Stock;
  no: Stock;
}

interface STOCK_BALANCES {
  [userId: string]: {
    [symbol: string]: UserStock;
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
  private capprice: number = 1000;

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
      case fromapi.BUY_ORDER:
        this.buyOrder(data, clientId);
        break;
      case fromapi.SELL_ORDER:
        this.sellOrder(data, clientId);
        break;
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
      RedisManager.getInstance().publishMessage("reset", {});
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
    RedisManager.getInstance().publishMessage("user_inr_balance", {
      type: "CREATE_USER",
      payload: {
        INR_BALANCES: this.INR_BALANCES[userId],
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
      RedisManager.getInstance().publishMessage("user_inr_balance", {
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
    RedisManager.getInstance().publishMessage("user_inr_balance", {
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
    RedisManager.getInstance().publishMessage("user_inr_balance", {
      type: "ONRAMP_INR",
      payload: {
        userId: userId,
        balance: this.INR_BALANCES[userId],
      },
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
    RedisManager.getInstance().publishMessage("user_stock_balance", {
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
    //@ts-ignore
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
    //@ts-ignore
    this.ORDERBOOK[stockSymbol][type] = sortedKeys;
  }

  // Add these methods to the Engine class
  private matchOrders(
    userId: string,
    stockSymbol: string,
    quantity: number,
    price: number,
    type: string,
    capPrice: number
  ) {
    console.log(
      `Matching orders for: ${userId}, ${stockSymbol}, ${quantity}, ${price}, ${type}, CapPrice: ${capPrice}`
    );

    if (!this.ORDERBOOK[stockSymbol]) {
      console.error(`Stock symbol ${stockSymbol} not found in ORDERBOOK`);
      return quantity;
    }

    let remainingQuantity = quantity;

    // Define primary and secondary matching sides
    const primaryMatchSide =
      type === "yes"
        ? this.ORDERBOOK[stockSymbol].yes
        : this.ORDERBOOK[stockSymbol].no;
    const secondaryMatchSide =
      type === "yes"
        ? this.ORDERBOOK[stockSymbol].no
        : this.ORDERBOOK[stockSymbol].yes;

    // Match with primary side (real orders)
    remainingQuantity = this.matchWithSide(
      primaryMatchSide,
      remainingQuantity,
      price,
      userId,
      stockSymbol,
      type,
      false
    );

    // Match with secondary side (pseudo orders)
    if (remainingQuantity > 0) {
      remainingQuantity = this.matchWithSide(
        secondaryMatchSide,
        remainingQuantity,
        capPrice - price,
        userId,
        stockSymbol,
        type,
        true
      );
    }

    return remainingQuantity;
  }

  private matchWithSide(
    side: any,
    remainingQuantity: number,
    price: number,
    userId: string,
    stockSymbol: string,
    type: string,
    isPseudo: boolean
  ) {
    for (const orderPrice in side) {
      if (
        (isPseudo && parseInt(orderPrice) === price) ||
        (!isPseudo && parseInt(orderPrice) <= price)
      ) {
        const availableOrders = side[orderPrice];
        let quantityToMatch = Math.min(
          remainingQuantity,
          availableOrders.total
        );

        remainingQuantity -= quantityToMatch;

        // Update user's balance and stock
        if (!isPseudo) {
          if (!this.INR_BALANCES[userId]) {
            console.error(`User ${userId} not found in INR_BALANCES`);
            return remainingQuantity; // Return without making changes if user doesn't exist
          }
          this.INR_BALANCES[userId].locked -=
            quantityToMatch * parseInt(orderPrice);
          if (!this.STOCK_BALANCES[userId]) this.STOCK_BALANCES[userId] = {};
          if (!this.STOCK_BALANCES[userId][stockSymbol])
            this.STOCK_BALANCES[userId][stockSymbol] = {
              yes: { quantity: 0, locked: 0 },
              no: { quantity: 0, locked: 0 },
            };
          //@ts-ignore
          this.STOCK_BALANCES[userId][stockSymbol][type].quantity +=
            quantityToMatch;
        }

        while (quantityToMatch > 0) {
          for (const sellerId in availableOrders.orders) {
            const sellerQuantity = availableOrders.orders[sellerId];
            const matchedQuantity = Math.min(sellerQuantity, quantityToMatch);

            // Update seller's balance and stock
            if (sellerId.startsWith("pseudo")) {
              const realSellerId = sellerId.replace("pseudo", "");
              if (!this.INR_BALANCES[realSellerId]) {
                console.error(`User ${realSellerId} not found in INR_BALANCES`);
                continue; // Skip this seller if they don't exist
              }
              this.INR_BALANCES[realSellerId].locked -=
                matchedQuantity * parseInt(orderPrice);
              if (!this.STOCK_BALANCES[realSellerId])
                this.STOCK_BALANCES[realSellerId] = {};
              if (!this.STOCK_BALANCES[realSellerId][stockSymbol])
                this.STOCK_BALANCES[realSellerId][stockSymbol] = {
                  yes: { quantity: 0, locked: 0 },
                  no: { quantity: 0, locked: 0 },
                };
              //@ts-ignore
              this.STOCK_BALANCES[realSellerId][stockSymbol][
                type === "yes" ? "no" : "yes"
              ].quantity += matchedQuantity;
            } else {
              if (!this.INR_BALANCES[sellerId]) {
                console.error(`User ${sellerId} not found in INR_BALANCES`);
                continue; // Skip this seller if they don't exist
              }
              this.INR_BALANCES[sellerId].balance +=
                matchedQuantity * parseInt(orderPrice);
              if (
                !this.STOCK_BALANCES[sellerId] ||
                !this.STOCK_BALANCES[sellerId][stockSymbol]
              ) {
                console.error(
                  `Stock balance not found for user ${sellerId} and symbol ${stockSymbol}`
                );
                continue; // Skip this seller if they don't have the stock balance
              }
              //@ts-ignore
              this.STOCK_BALANCES[sellerId][stockSymbol][type].locked -=
                matchedQuantity;
            }

            quantityToMatch -= matchedQuantity;
            availableOrders.orders[sellerId] -= matchedQuantity;
            availableOrders.total -= matchedQuantity;

            if (availableOrders.orders[sellerId] <= 0) {
              delete availableOrders.orders[sellerId];
            }

            if (quantityToMatch === 0) break;
          }
        }

        if (availableOrders.total <= 0) {
          delete side[orderPrice];
        }

        if (remainingQuantity === 0) break;
      }
    }

    return remainingQuantity;
  }

  buyOrder(
    {
      userId,
      stockSymbol,
      quantity,
      price,
      type,
    }: {
      userId: string;
      stockSymbol: string;
      quantity: number;
      price: number;
      type: string;
    },
    clientId: string
  ) {
    try {
      if (!this.INR_BALANCES[userId]) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "BUY_ORDER",
          payload: { message: "User not found" },
        });

        return;
      }

      if (!this.ORDERBOOK[stockSymbol]) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "BUY_ORDER",
          payload: { message: `Market for ${stockSymbol} does not exist` },
        });
        RedisManager.getInstance().publishMessage("buy_order", {
          type: "BUY_ORDER",
          payload: { message: `Market for ${stockSymbol} does not exist` },
        });
        return;
      }

      const totalCost = quantity * price;
      if (this.INR_BALANCES[userId].balance < totalCost) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "BUY_ORDER",
          payload: { message: "Insufficient balance" },
        });

        return;
      }

      // Lock the funds
      this.INR_BALANCES[userId].balance -= totalCost;
      this.INR_BALANCES[userId].locked += totalCost;

      // Try to match with existing orders
      const remainingQuantity = this.matchOrders(
        //@ts-ignore
        userId,
        stockSymbol,
        quantity,
        price,
        type,
        this.capprice
      );

      // If there's remaining quantity, place a new order
      if (remainingQuantity === 0) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "BUY_ORDER",
          payload: {
            message: "Buy order fully matched",
            ORDERBOOK: this.ORDERBOOK,
            STOCK_BALANCES: this.STOCK_BALANCES,
            INR_BALANCES: this.INR_BALANCES,
          },
        });
        RedisManager.getInstance().publishMessage("user_inr_balance", {
          type: "CREATE_USER",
          payload: {
            INR_BALANCES: this.INR_BALANCES[userId],
          },
        });
        RedisManager.getInstance().publishMessage("stock_orderbook", {
          type: "GET_STOCK_ORDERBOOK",
          payload: {
            symbol: stockSymbol,
            orderbook: this.ORDERBOOK[stockSymbol],
          },
        });
        RedisManager.getInstance().publishMessage("stock_balance", {
          type: "BUY_ORDER",
          payload: {
            userId: userId,
            STOCK_BALANCES: this.STOCK_BALANCES[userId],
          },
        });
      }
      const sellSide =
        type === "yes"
          ? this.ORDERBOOK[stockSymbol].no
          : this.ORDERBOOK[stockSymbol].yes;

      // If no match is found, create a pseudo sell order
      let newprice = this.capprice - price;
      const pseudoUserId = `pseudo${userId}`;
      if (!sellSide[newprice]) {
        sellSide[newprice] = { total: 0, orders: {} };
      }
      sellSide[newprice].orders[pseudoUserId] =
        (sellSide[newprice].orders[pseudoUserId] || 0) + remainingQuantity;
      sellSide[newprice].total += remainingQuantity;
      //sort the order book after adding the new order
      let newOrderSide = type === "yes" ? "no" : "yes";
      this.sortOrderBook(stockSymbol, "yes");
      this.sortOrderBook(stockSymbol, "no");

      RedisManager.getInstance().sendToApi(clientId, {
        type: "BUY_ORDER",
        payload: {
          message: `Buy order placed for ${quantity} ${type} at price ${price}, waiting for matching no order`,
          ORDERBOOK: this.ORDERBOOK,
          STOCK_BALANCES: this.STOCK_BALANCES,
          INR_BALANCES: this.INR_BALANCES,
        },
      });
      RedisManager.getInstance().publishMessage("user_inr_balance", {
        type: "CREATE_USER",
        payload: {
          INR_BALANCES: this.INR_BALANCES[userId],
        },
      });
      RedisManager.getInstance().publishMessage("stock_orderbook", {
        type: "GET_STOCK_ORDERBOOK",
        payload: {
          symbol: stockSymbol,
          orderbook: this.ORDERBOOK[stockSymbol],
        },
      });
      RedisManager.getInstance().publishMessage("stock_balance", {
        type: "BUY_ORDER",
        payload: {
          userId: userId,
          STOCK_BALANCES: this.STOCK_BALANCES[userId],
        },
      });
    } catch (err) {
      console.error(err);
      RedisManager.getInstance().sendToApi(clientId, {
        type: "BUY_ORDER",
        payload: { message: "Failed to process buy order" },
      });
      RedisManager.getInstance().publishMessage("buy_order", {
        type: "BUY_ORDER",
        payload: { message: "Failed to process buy order" },
      });
    }
  }

  sellOrder(
    {
      userId,
      stockSymbol,
      quantity,
      price,
      type,
    }: {
      userId: string;
      stockSymbol: string;
      quantity: number;
      price: number;
      type: string;
    },
    clientId: string
  ) {
    try {
      if (
        !this.STOCK_BALANCES[userId] ||
        !this.STOCK_BALANCES[userId][stockSymbol] ||
        //@ts-ignore
        !this.STOCK_BALANCES[userId][stockSymbol][type]
      ) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "SELL_ORDER",
          payload: { message: "User does not have stock to sell" },
        });

        return;
      }

      //@ts-ignore
      const userStock = this.STOCK_BALANCES[userId][stockSymbol][type];
      if (userStock.quantity < quantity) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "SELL_ORDER",
          payload: { message: "Insufficient stock to sell" },
        });

        return;
      }

      // Lock stock for the sell order
      userStock.quantity -= quantity;
      userStock.locked += quantity;

      if (!this.ORDERBOOK[stockSymbol]) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "SELL_ORDER",
          payload: { message: `Market for ${stockSymbol} does not exist` },
        });
        return;
      }

      const newPrice = this.capprice - price;
      const buySide =
        type === "yes"
          ? this.ORDERBOOK[stockSymbol].no
          : this.ORDERBOOK[stockSymbol].yes;

      if (buySide[newPrice] && buySide[newPrice].orders) {
        let remainingQuantity = quantity;
        const pseudoOrders = Object.keys(buySide[newPrice].orders).filter(
          (orderId) => orderId.startsWith("pseudo")
        );

        for (const pseudoOrderId of pseudoOrders) {
          if (remainingQuantity <= 0) break;

          const pseudoUserId = pseudoOrderId.split("pseudo")[1];
          const pseudoQuantity = buySide[newPrice].orders[pseudoOrderId];
          const matchedQuantity = Math.min(remainingQuantity, pseudoQuantity);

          // Update seller's balance
          this.INR_BALANCES[userId].balance += matchedQuantity * price;

          // Update pseudo buyer's stock balance
          if (!this.STOCK_BALANCES[pseudoUserId]) {
            this.STOCK_BALANCES[pseudoUserId] = {};
          }
          if (!this.STOCK_BALANCES[pseudoUserId][stockSymbol]) {
            this.STOCK_BALANCES[pseudoUserId][stockSymbol] = {
              yes: { quantity: 0, locked: 0 },
              no: { quantity: 0, locked: 0 },
            };
          }
          //@ts-ignore
          this.STOCK_BALANCES[pseudoUserId][stockSymbol][type].quantity +=
            matchedQuantity;

          // Release pseudo buyer's locked funds
          this.INR_BALANCES[pseudoUserId].locked -= matchedQuantity * newPrice;

          // Update order book
          buySide[newPrice].orders[pseudoOrderId] -= matchedQuantity;
          buySide[newPrice].total -= matchedQuantity;
          if (buySide[newPrice].orders[pseudoOrderId] <= 0) {
            delete buySide[newPrice].orders[pseudoOrderId];
          }

          remainingQuantity -= matchedQuantity;
        }

        // Remove the price level if no orders remain
        if (buySide[newPrice].total <= 0) {
          delete buySide[newPrice];
        }
        // Place a new sell order for the remaining quantity
        if (remainingQuantity > 0) {
          const sellSide =
            type === "yes"
              ? this.ORDERBOOK[stockSymbol].yes
              : this.ORDERBOOK[stockSymbol].no;
          if (!sellSide[price]) {
            sellSide[price] = { total: 0, orders: {} };
          }
          sellSide[price].orders[userId] = remainingQuantity;
          sellSide[price].total += remainingQuantity;
        }
        quantity = remainingQuantity;
      }
      // Place a new sell order for the remaining quantity
      const sellSide =
        type === "yes"
          ? this.ORDERBOOK[stockSymbol].yes
          : this.ORDERBOOK[stockSymbol].no;
      if (!sellSide[price]) {
        sellSide[price] = { total: 0, orders: {} };
      }
      sellSide[price].orders[userId] =
        (sellSide[price].orders[userId] || 0) + quantity;
      sellSide[price].total += quantity;

      // Sort the order book
      this.sortOrderBook(stockSymbol, "yes");
      this.sortOrderBook(stockSymbol, "no");

      RedisManager.getInstance().sendToApi(clientId, {
        type: "SELL_ORDER",
        payload: {
          message: `Sell order fully matched for ${quantity} ${type} at price ${price}`,
          ORDERBOOK: this.ORDERBOOK,
          STOCK_BALANCES: this.STOCK_BALANCES,
          INR_BALANCES: this.INR_BALANCES,
        },
      });
      RedisManager.getInstance().publishMessage("user_inr_balance", {
        type: "CREATE_USER",
        payload: {
          INR_BALANCES: this.INR_BALANCES[userId],
        },
      });
      RedisManager.getInstance().publishMessage("stock_orderbook", {
        type: "GET_STOCK_ORDERBOOK",
        payload: {
          symbol: stockSymbol,
          orderbook: this.ORDERBOOK[stockSymbol],
        },
      });
      RedisManager.getInstance().publishMessage("stock_balance", {
        type: "BUY_ORDER",
        payload: {
          userId: userId,
          STOCK_BALANCES: this.STOCK_BALANCES[userId],
        },
      });
    } catch (err) {
      console.error(err);
      RedisManager.getInstance().sendToApi(clientId, {
        type: "SELL_ORDER",
        payload: { message: "Failed to process sell order" },
      });
      RedisManager.getInstance().publishMessage("sell_order", {
        type: "SELL_ORDER",
        payload: { message: "Failed to process sell order" },
      });
    }
  }
}
