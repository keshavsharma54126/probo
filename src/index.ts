import express from "express";
const app = express();

const capprice=1050;

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

let pendingState = [];

app.post("/reset", async (req: any, res: any) => {
  INR_BALANCES = {};
  ORDERBOOK = {};
  STOCK_BALANCES = {};
  return res.status(201).json({
    message: "data reset successfull",
    INR_BALANCES,
    ORDERBOOK,
    STOCK_BALANCES,
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
  const { userId, stockSymbol, quantity, price, type } = req.body;

  if (!INR_BALANCES[userId]) {
    return res.status(400).json({ message: "User not found" });
  }
  // Check if the stock symbol exists in the order book
  if (!ORDERBOOK[stockSymbol]) {
    return res
      .status(400)
      .json({ message: `Market for ${stockSymbol} does not exist` });
  }
  const totalCost = quantity * price;
  if (INR_BALANCES[userId].balance < totalCost) {
    return res.status(400).json({ message: "Insufficient balance" });
  }
  // Lock user funds
  INR_BALANCES[userId].balance -= totalCost;
  INR_BALANCES[userId].locked += totalCost;

  // Determine the sides of the order book
  const buySide =
    type === "yes" ? ORDERBOOK[stockSymbol].yes : ORDERBOOK[stockSymbol].no;
  const sellSide =
    type === "yes" ? ORDERBOOK[stockSymbol].no : ORDERBOOK[stockSymbol].yes;

  // Try to match with existing sell orders
  const matched = matchOrders(userId, stockSymbol, quantity, price, type);

  if (matched) {
    return res.status(200).json({
      message: `Buy order matched for ${quantity} ${type} at price ${price}`,
      ORDERBOOK,
      INR_BALANCES,
    });
  }

  // If no match is found, create a pseudo sell order
  let newprice= capprice-price
  const pseudoUserId = `${userId}`;
  if (!sellSide[newprice]) {
    sellSide[newprice] = { total: 0, orders: {} };
  }
  sellSide[newprice].orders[pseudoUserId] =
    (sellSide[newprice].orders[pseudoUserId] || 0) + quantity;
  sellSide[newprice].total += quantity;

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
  type: string
) {
  const sellSide =
    type === "yes" ? ORDERBOOK[stockSymbol].yes : ORDERBOOK[stockSymbol].no;

  // Check if there are sell orders at the same or lower price
  for (const sellPrice in sellSide) {
    if (parseInt(sellPrice) <= price) {
      const availableOrders = sellSide[sellPrice];

      // Calculate the matched quantity
      let matchedQuantity = Math.min(availableOrders.total, quantity);
      const remainingQuantity = quantity - matchedQuantity;

      // Update the matched user's stock balances and release the funds
      STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {};
      STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][
        stockSymbol
      ] || {
        yes: { quantity: 0, locked: 0 },
        no: { quantity: 0, locked: 0 },
      };
      STOCK_BALANCES[userId][stockSymbol][type].quantity += matchedQuantity;
      INR_BALANCES[userId].locked -= matchedQuantity * price;

      // Deduct the matched quantity from the sell orders
      availableOrders.total -= matchedQuantity;
      for (const sellerId in availableOrders.orders) {
        const sellerQuantity = availableOrders.orders[sellerId] 
        const toDeduct = Math.min(sellerQuantity, matchedQuantity);

        STOCK_BALANCES[sellerId][stockSymbol][
          type === "yes" ? "no" : "yes"
        ].quantity -= toDeduct;
        INR_BALANCES[sellerId].balance += toDeduct * price;
        matchedQuantity -= toDeduct;

        if (toDeduct < sellerQuantity) {
          availableOrders.orders[sellerId] -= toDeduct;
        } else {
          delete availableOrders.orders[sellerId];
        }

        if (matchedQuantity <= 0) break;
      }

      // Remove the price level if no orders remain
      if (availableOrders.total <= 0) {
        delete sellSide[sellPrice];
      }

      return remainingQuantity === 0;
    }
  }
  return false;
}

app.post("/order/sell", (req: any, res: any) => {
  const { userId, stockSymbol, quantity, price, type } = req.body;

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

  // Add to order book
  if (!ORDERBOOK[stockSymbol]) {
    return res
      .status(400)
      .json({ message: `Market for ${stockSymbol} does not exist` });
  }
  const side =
    type === "yes" ? ORDERBOOK[stockSymbol].yes : ORDERBOOK[stockSymbol].no;

  if (!side[price]) {
    side[price] = { total: 0, orders: {} };
  }
  side[price].orders[userId] = (side[price].orders[userId] || 0) + quantity;
  side[price].total += quantity;

  // Attempt to finalize any pseudo orders
  if(type==="yes"){
    finalizeOrder(stockSymbol, price, quantity, userId, "no");
  }
  else{
    finalizeOrder(stockSymbol, price, quantity, userId, "yes");
  }

  return res.status(201).json({
    message: `Sell order placed for ${quantity} ${type} at price ${price}`,
    ORDERBOOK,
    STOCK_BALANCES,
  });
});

// Function to finalize pseudo orders with real buy orders
function finalizeOrder(
  stockSymbol: string,
  price: string,
  quantity: number,
  userId: string,
  type: string
) {
  const oppositeType = type === "yes" ? "no" : "yes";
  const sellSide = ORDERBOOK[stockSymbol][oppositeType];

  // Find the pseudo order corresponding to the original user's request
  const pseudoUserId = `pseudo_${userId}`;
  const sellOrders = sellSide[price]?.orders || {};

  // Check if there is a pseudo order for the user that initiated the original buy
  if (sellOrders[pseudoUserId] && sellOrders[pseudoUserId] >= quantity) {
    // Transfer the "yes" stock to the original user who wanted it
    STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {};
    STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][
      stockSymbol
    ] || {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
    STOCK_BALANCES[userId][stockSymbol][type].quantity += quantity;

    // Debit the locked funds from the user's balance
    INR_BALANCES[userId].locked -= quantity * parseFloat(price);

    // Find the real buyer who is buying the "no" stock
    const realBuyerId = Object.keys(sellOrders).find(
      (id) => id !== pseudoUserId
    );
    if (realBuyerId) {
      STOCK_BALANCES[realBuyerId] = STOCK_BALANCES[realBuyerId] || {};
      STOCK_BALANCES[realBuyerId][stockSymbol] = STOCK_BALANCES[realBuyerId][
        stockSymbol
      ] || {
        yes: { quantity: 0, locked: 0 },
        no: { quantity: 0, locked: 0 },
      };
      STOCK_BALANCES[realBuyerId][stockSymbol][oppositeType].quantity +=
        quantity;

      // Transfer the funds from the real buyer to the original user
      INR_BALANCES[realBuyerId].balance -= quantity * parseFloat(price);
      INR_BALANCES[userId].balance += quantity * parseFloat(price);

      // Adjust the pseudo order and remove it if fully matched
      sellOrders[pseudoUserId] -= quantity;
      if (sellOrders[pseudoUserId] <= 0) {
        delete sellOrders[pseudoUserId];
      }

      // Adjust the sell side's total quantity
      sellSide[price].total -= quantity;
      if (sellSide[price].total <= 0) {
        delete sellSide[price];
      }

      return true;
    }
  }

  return false;
}

// app.post("/trade/mint", (req, res) => {
//   const { stockSymbol, quantity } = req.body;
// });

app.listen(4001, () => {
  console.log("server is running on port 4001");
});

export default app;
