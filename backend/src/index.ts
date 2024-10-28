import express from "express";
import { RedisManager } from "./redisManager.js";
import * as toengine from "./types/index.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const capprice = 1000;

app.use(express.json());
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
app.post("/reset", async (req: any, res: any) => {
  const response = await RedisManager.getInstance().sendAndAwait({
    type: toengine.RESET,
    data: {},
  });
  return res.status(201).json({
    payload: (response as toengine.MessageFromEngine).payload,
  });
});

app.post("/user/create/:userId", (req: any, res: any) => {
  try {
    const { userId } = req.params;
    if (INR_BALANCES[userId]) {
      return res.status(400).json({
        message: "user already existe",
      });
    }

    INR_BALANCES[userId] = {
      balance: 0,
      locked: 0,
    };
    return res.status(201).json({
      message: `User ${userId} created`,
      INR_BALANCES,
    });
  } catch (err) {
    return res.status(500).json({
      message: "user creation failed",
    });
  }
});

app.post("/symbol/create/:stockSymbol", (req: any, res: any) => {
  try {
    const { stockSymbol } = req.params;
    if (ORDERBOOK[stockSymbol as keyof typeof ORDERBOOK]) {
      return res.status(400).json({
        message: "symbol already present",
      });
    }
    //@ts-ignore
    ORDERBOOK[stockSymbol] = {
      yes: {},
      no: {},
    };
    //@ts-ignore
    return res.status(201).json({
      message: `Symbol ${stockSymbol} created`,
      ORDERBOOK,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to create symbol",
    });
  }
});
app.get("/orderbook", (req: any, res: any) => {
  try {
    return res.json({
      ORDERBOOK,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get order  book",
    });
  }
});
app.get("/balances/inr", (req: any, res: any) => {
  try {
    return res.json({
      INR_BALANCES,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get inr balances",
    });
  }
});

app.get("/balances/stock", (req: any, res: any) => {
  try {
    return res.status(200).json({
      STOCK_BALANCES,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get the stock balances",
    });
  }
});

app.get("/balance/inr/:userId", (req: any, res: any) => {
  try {
    const { userId } = req.params;
    if (!INR_BALANCES[userId]) {
      return res.status(400).json({
        message: "user not found",
      });
    }
    const userBalance = {
      userId: userId,
      balance: INR_BALANCES[userId].balance,
    };
    return res.json(userBalance);
  } catch (err) {
    return res.status(500).json({
      message: "failed to get the inr balance for user",
    });
  }
});

app.post("/onramp/inr", async (req: any, res: any) => {
  try {
    const body = await req.body;

    if (!INR_BALANCES[body.userId]) {
      return res.status(400).json({
        message: "user not found",
      });
    }

    INR_BALANCES[body.userId].balance += body.amount;
    return res.json({
      message: `Onramped ${body.userId} with amount ${body.amount}`,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to create onramp inr",
    });
  }
});

app.get("/balance/stock/:userId", (req: any, res: any) => {
  try {
    const { userId } = req.params;
    //@ts-ignore
    if (!STOCK_BALANCES[userId]) {
      return res.status(400).json({
        message: "user not found",
      });
    }
    //@ts-ignore
    return res.json(STOCK_BALANCES[userId]);
  } catch (err) {
    return res.status(500).json({
      message: "failed to get the stock balance for user",
    });
  }
});
app.get("/orderbook/:stockSymbol", (req: any, res: any) => {
  const { stockSymbol } = req.params;
  try {
    if (!ORDERBOOK[stockSymbol]) {
      return res.json({
        message: `${stockSymbol} not found in order book`,
      });
    }
    return res.json({
      orderbook: ORDERBOOK[stockSymbol],
    });
  } catch (err) {
    return res.json({
      message: `could not get the order book for the ${stockSymbol}`,
    });
  }
});
app.post("/order/buy", (req: any, res: any) => {
  let { userId, stockSymbol, quantity, price, type } = req.body;

  if (!INR_BALANCES[userId]) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check if the stock symbol exists in the order book
  if (!ORDERBOOK[stockSymbol]) {
    return res
      .status(400)
      .json({ message: `Market for ${stockSymbol} does not exist` });
  }
  //check if the user has enough balance to buy the stock
  const totalCost = quantity * price;
  if (INR_BALANCES[userId].balance < totalCost) {
    return res.status(400).json({ message: "Insufficient balance" });
  }
  // Lock user funds
  INR_BALANCES[userId].balance -= totalCost;
  INR_BALANCES[userId].locked += totalCost;

  // Try to match with existing sell orders
  const remainingQuantity = matchOrders(
    userId,
    stockSymbol,
    quantity,
    price,
    type,
    capprice
  );

  if (remainingQuantity === 0) {
    return res.status(200).json({
      message: `Buy order matched for ${quantity} ${type} at price ${price}`,
      ORDERBOOK,
      INR_BALANCES,
    });
  }
  // Determine the sides of the order book to add the remaining quantity pseudo orders if all the quantity is not matched
  const sellSide =
    type === "yes" ? ORDERBOOK[stockSymbol].no : ORDERBOOK[stockSymbol].yes;

  // If no match is found, create a pseudo sell order
  let newprice = capprice - price;
  const pseudoUserId = `pseudo${userId}`;
  if (!sellSide[newprice]) {
    sellSide[newprice] = { total: 0, orders: {} };
  }
  sellSide[newprice].orders[pseudoUserId] =
    (sellSide[newprice].orders[pseudoUserId] || 0) + remainingQuantity;
  sellSide[newprice].total += remainingQuantity;
  //sort the order book after adding the new order
  let newOrderSide = type === "yes" ? "no" : "yes";
  sortOrderBook(stockSymbol, "yes");
  sortOrderBook(stockSymbol, "no");

  return res.status(201).json({
    message: `Buy order placed for ${quantity} ${type} at price ${price}, waiting for matching no order`,
    ORDERBOOK,
    INR_BALANCES,
  });
});
function matchOrders(
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

  if (!ORDERBOOK[stockSymbol]) {
    console.error(`Stock symbol ${stockSymbol} not found in ORDERBOOK`);
    return quantity;
  }

  let remainingQuantity = quantity;

  // Define primary and secondary matching sides
  const primaryMatchSide =
    type === "yes" ? ORDERBOOK[stockSymbol].yes : ORDERBOOK[stockSymbol].no;
  const secondaryMatchSide =
    type === "yes" ? ORDERBOOK[stockSymbol].no : ORDERBOOK[stockSymbol].yes;

  // Match with primary side (real orders)
  remainingQuantity = matchWithSide(
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
    remainingQuantity = matchWithSide(
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

function matchWithSide(
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
      let quantityToMatch = Math.min(remainingQuantity, availableOrders.total);

      remainingQuantity -= quantityToMatch;

      // Update user's balance and stock
      if (!isPseudo) {
        if (!INR_BALANCES[userId]) {
          console.error(`User ${userId} not found in INR_BALANCES`);
          return remainingQuantity; // Return without making changes if user doesn't exist
        }
        INR_BALANCES[userId].locked -= quantityToMatch * parseInt(orderPrice);
        if (!STOCK_BALANCES[userId]) STOCK_BALANCES[userId] = {};
        if (!STOCK_BALANCES[userId][stockSymbol])
          STOCK_BALANCES[userId][stockSymbol] = {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 },
          };
        STOCK_BALANCES[userId][stockSymbol][type].quantity += quantityToMatch;
      }

      while (quantityToMatch > 0) {
        for (const sellerId in availableOrders.orders) {
          const sellerQuantity = availableOrders.orders[sellerId];
          const matchedQuantity = Math.min(sellerQuantity, quantityToMatch);

          // Update seller's balance and stock
          if (sellerId.startsWith("pseudo")) {
            const realSellerId = sellerId.replace("pseudo", "");
            if (!INR_BALANCES[realSellerId]) {
              console.error(`User ${realSellerId} not found in INR_BALANCES`);
              continue; // Skip this seller if they don't exist
            }
            INR_BALANCES[realSellerId].locked -=
              matchedQuantity * parseInt(orderPrice);
            if (!STOCK_BALANCES[realSellerId])
              STOCK_BALANCES[realSellerId] = {};
            if (!STOCK_BALANCES[realSellerId][stockSymbol])
              STOCK_BALANCES[realSellerId][stockSymbol] = {
                yes: { quantity: 0, locked: 0 },
                no: { quantity: 0, locked: 0 },
              };
            STOCK_BALANCES[realSellerId][stockSymbol][
              type === "yes" ? "no" : "yes"
            ].quantity += matchedQuantity;
          } else {
            if (!INR_BALANCES[sellerId]) {
              console.error(`User ${sellerId} not found in INR_BALANCES`);
              continue; // Skip this seller if they don't exist
            }
            INR_BALANCES[sellerId].balance +=
              matchedQuantity * parseInt(orderPrice);
            if (
              !STOCK_BALANCES[sellerId] ||
              !STOCK_BALANCES[sellerId][stockSymbol]
            ) {
              console.error(
                `Stock balance not found for user ${sellerId} and symbol ${stockSymbol}`
              );
              continue; // Skip this seller if they don't have the stock balance
            }
            STOCK_BALANCES[sellerId][stockSymbol][type].locked -=
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

app.post("/order/sell", (req: any, res: any) => {
  try {
    let { userId, stockSymbol, quantity, price, type } = req.body;

    if (
      !STOCK_BALANCES[userId] ||
      !STOCK_BALANCES[userId][stockSymbol] ||
      !STOCK_BALANCES[userId][stockSymbol][type]
    ) {
      return res
        .status(400)
        .json({ message: "User does not have stock to sell" });
    }

    const userStock = STOCK_BALANCES[userId][stockSymbol][type];
    if (userStock.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock to sell" });
    }

    // Lock stock for the sell order
    userStock.quantity -= quantity;
    userStock.locked += quantity;

    if (!ORDERBOOK[stockSymbol]) {
      return res
        .status(400)
        .json({ message: `Market for ${stockSymbol} does not exist` });
    }

    const newPrice = capprice - price;
    const buySide =
      type === "yes" ? ORDERBOOK[stockSymbol].no : ORDERBOOK[stockSymbol].yes;

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
        INR_BALANCES[userId].balance += matchedQuantity * price;

        // Update pseudo buyer's stock balance
        if (!STOCK_BALANCES[pseudoUserId]) {
          STOCK_BALANCES[pseudoUserId] = {};
        }
        if (!STOCK_BALANCES[pseudoUserId][stockSymbol]) {
          STOCK_BALANCES[pseudoUserId][stockSymbol] = {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 },
          };
        }
        STOCK_BALANCES[pseudoUserId][stockSymbol][type].quantity +=
          matchedQuantity;

        // Release pseudo buyer's locked funds
        INR_BALANCES[pseudoUserId].locked -= matchedQuantity * newPrice;

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

      if (remainingQuantity === 0) {
        return res.status(200).json({
          message: `Sell order fully matched for ${quantity} ${type} at price ${price}`,
          ORDERBOOK,
          STOCK_BALANCES,
          INR_BALANCES,
        });
      }
      // If there's remaining quantity, update the quantity for the new sell order
      quantity = remainingQuantity;
    }

    // Place a new sell order for the remaining quantity
    const sellSide =
      type === "yes" ? ORDERBOOK[stockSymbol].yes : ORDERBOOK[stockSymbol].no;
    if (!sellSide[price]) {
      sellSide[price] = { total: 0, orders: {} };
    }
    sellSide[price].orders[userId] =
      (sellSide[price].orders[userId] || 0) + quantity;
    sellSide[price].total += quantity;

    // Sort the order book
    sortOrderBook(stockSymbol, "yes");
    sortOrderBook(stockSymbol, "no");

    return res.status(201).json({
      message: `Sell order placed for ${quantity} ${type} at price ${price}`,
      ORDERBOOK,
      STOCK_BALANCES,
      INR_BALANCES,
    });
  } catch (err) {
    console.log(err);
  }
});

function sortOrderBook(stockSymbol: string, type: string) {
  const sortSide = ORDERBOOK[stockSymbol][type];
  const sortedKeys = Object.keys(sortSide)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .reduce((acc, price) => {
      acc[price] = sortSide[price];
      return acc;
    }, {} as { [key: string]: any });
  ORDERBOOK[stockSymbol][type] = sortedKeys;
}

app.listen(4001, () => {
  console.log("server is running on port 4001");
});

export default app;
