import express from "express";
import { RedisManager } from "./redisManager.js";
import * as fromengine from "./types/from.js";
import * as toengine from "./types/to.js";
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
  //         total: 12,u
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
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.RESET,
      data: {},
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to reset the engine",
    });
  }
});

app.post("/user/create/:userId", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.CREATE_USER,
      data: {
        userId: req.params.userId,
      },
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "user creation failed",
    });
  }
});

app.post("/symbol/create/:stockSymbol", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.CREATE_SYMBOL,
      data: {
        symbol: req.params.stockSymbol,
      },
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to create symbol",
    });
  }
});
app.get("/orderbook", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.GET_ORDERBOOK,
      data: {},
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get order  book",
    });
  }
});
app.get("/balances/inr", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.GET_INR_BALANCES,
      data: {},
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get inr balances",
    });
  }
});

app.get("/balances/stock", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.GET_STOCK_BALANCES,
      data: {},
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get the stock balances",
    });
  }
});

app.get("/balance/inr/:userId", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.GET_USER_INR_BALANCE,
      data: {
        userId: req.params.userId,
      },
    });

    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get the inr balance for user",
    });
  }
});

app.post("/onramp/inr", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.ONRAMP_INR,
      data: {
        userId: req.body.userId,
        amount: req.body.amount,
      },
    });

    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to create onramp inr",
    });
  }
});

app.get("/balance/stock/:userId", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.GET_USER_STOCK_BALANCE,
      data: {
        userId: req.params.userId,
      },
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.status(500).json({
      message: "failed to get the stock balance for user",
    });
  }
});
app.get("/orderbook/:stockSymbol", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.GET_STOCK_ORDERBOOK,
      data: {
        symbol: req.params.stockSymbol,
      },
    });
    res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    return res.json({
      message: `could not get the order book for the ${req.params.stockSymbol}`,
    });
  }
});
app.post("/order/buy", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.BUY_ORDER,
      data: req.body,
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (e) {
    return res.status(500).json({
      message: "failed to place the buy order",
    });
  }
});
// function matchOrders(
//   userId: string,
//   stockSymbol: string,
//   quantity: number,
//   price: number,
//   type: string,
//   capPrice: number
// ) {
//   console.log(
//     `Matching orders for: ${userId}, ${stockSymbol}, ${quantity}, ${price}, ${type}, CapPrice: ${capPrice}`
//   );

//   if (!ORDERBOOK[stockSymbol]) {
//     console.error(`Stock symbol ${stockSymbol} not found in ORDERBOOK`);
//     return quantity;
//   }

//   let remainingQuantity = quantity;

//   // Define primary and secondary matching sides
//   const primaryMatchSide =
//     type === "yes" ? ORDERBOOK[stockSymbol].yes : ORDERBOOK[stockSymbol].no;
//   const secondaryMatchSide =
//     type === "yes" ? ORDERBOOK[stockSymbol].no : ORDERBOOK[stockSymbol].yes;

//   // Match with primary side (real orders)
//   remainingQuantity = matchWithSide(
//     primaryMatchSide,
//     remainingQuantity,
//     price,
//     userId,
//     stockSymbol,
//     type,
//     false
//   );

//   // Match with secondary side (pseudo orders)
//   if (remainingQuantity > 0) {
//     remainingQuantity = matchWithSide(
//       secondaryMatchSide,
//       remainingQuantity,
//       capPrice - price,
//       userId,
//       stockSymbol,
//       type,
//       true
//     );
//   }

//   return remainingQuantity;
// }

// function matchWithSide(
//   side: any,
//   remainingQuantity: number,
//   price: number,
//   userId: string,
//   stockSymbol: string,
//   type: string,
//   isPseudo: boolean
// ) {
//   for (const orderPrice in side) {
//     if (
//       (isPseudo && parseInt(orderPrice) === price) ||
//       (!isPseudo && parseInt(orderPrice) <= price)
//     ) {
//       const availableOrders = side[orderPrice];
//       let quantityToMatch = Math.min(remainingQuantity, availableOrders.total);

//       remainingQuantity -= quantityToMatch;

//       // Update user's balance and stock
//       if (!isPseudo) {
//         if (!INR_BALANCES[userId]) {
//           console.error(`User ${userId} not found in INR_BALANCES`);
//           return remainingQuantity; // Return without making changes if user doesn't exist
//         }
//         INR_BALANCES[userId].locked -= quantityToMatch * parseInt(orderPrice);
//         if (!STOCK_BALANCES[userId]) STOCK_BALANCES[userId] = {};
//         if (!STOCK_BALANCES[userId][stockSymbol])
//           STOCK_BALANCES[userId][stockSymbol] = {
//             yes: { quantity: 0, locked: 0 },
//             no: { quantity: 0, locked: 0 },
//           };
//         STOCK_BALANCES[userId][stockSymbol][type].quantity += quantityToMatch;
//       }

//       while (quantityToMatch > 0) {
//         for (const sellerId in availableOrders.orders) {
//           const sellerQuantity = availableOrders.orders[sellerId];
//           const matchedQuantity = Math.min(sellerQuantity, quantityToMatch);

//           // Update seller's balance and stock
//           if (sellerId.startsWith("pseudo")) {
//             const realSellerId = sellerId.replace("pseudo", "");
//             if (!INR_BALANCES[realSellerId]) {
//               console.error(`User ${realSellerId} not found in INR_BALANCES`);
//               continue; // Skip this seller if they don't exist
//             }
//             INR_BALANCES[realSellerId].locked -=
//               matchedQuantity * parseInt(orderPrice);
//             if (!STOCK_BALANCES[realSellerId])
//               STOCK_BALANCES[realSellerId] = {};
//             if (!STOCK_BALANCES[realSellerId][stockSymbol])
//               STOCK_BALANCES[realSellerId][stockSymbol] = {
//                 yes: { quantity: 0, locked: 0 },
//                 no: { quantity: 0, locked: 0 },
//               };
//             STOCK_BALANCES[realSellerId][stockSymbol][
//               type === "yes" ? "no" : "yes"
//             ].quantity += matchedQuantity;
//           } else {
//             if (!INR_BALANCES[sellerId]) {
//               console.error(`User ${sellerId} not found in INR_BALANCES`);
//               continue; // Skip this seller if they don't exist
//             }
//             INR_BALANCES[sellerId].balance +=
//               matchedQuantity * parseInt(orderPrice);
//             if (
//               !STOCK_BALANCES[sellerId] ||
//               !STOCK_BALANCES[sellerId][stockSymbol]
//             ) {
//               console.error(
//                 `Stock balance not found for user ${sellerId} and symbol ${stockSymbol}`
//               );
//               continue; // Skip this seller if they don't have the stock balance
//             }
//             STOCK_BALANCES[sellerId][stockSymbol][type].locked -=
//               matchedQuantity;
//           }

//           quantityToMatch -= matchedQuantity;
//           availableOrders.orders[sellerId] -= matchedQuantity;
//           availableOrders.total -= matchedQuantity;

//           if (availableOrders.orders[sellerId] <= 0) {
//             delete availableOrders.orders[sellerId];
//           }

//           if (quantityToMatch === 0) break;
//         }
//       }

//       if (availableOrders.total <= 0) {
//         delete side[orderPrice];
//       }

//       if (remainingQuantity === 0) break;
//     }
//   }

//   return remainingQuantity;
// }

app.post("/order/sell", async (req: any, res: any) => {
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: toengine.SELL_ORDER,
      data: req.body,
    });
    return res.json({
      payload: (response as fromengine.MessageFromEngine).payload,
    });
  } catch (err) {
    console.log(err);
  }
});

// function sortOrderBook(stockSymbol: string, type: string) {
//   const sortSide = ORDERBOOK[stockSymbol][type];
//   const sortedKeys = Object.keys(sortSide)
//     .sort((a, b) => parseInt(a) - parseInt(b))
//     .reduce((acc, price) => {
//       acc[price] = sortSide[price];
//       return acc;
//     }, {} as { [key: string]: any });
//   ORDERBOOK[stockSymbol][type] = sortedKeys;
// }

app.listen(4001, () => {
  console.log("server is running on port 4001");
});

export default app;
