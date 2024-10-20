import express from "express";
const app = express();

const capprice=1000;

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
//check if the user exists in the inr balances
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
  const matched = matchOrders(userId, stockSymbol, quantity, price, type);

  if (matched) {
    return res.status(200).json({
      message: `Buy order matched for ${quantity} ${type} at price ${price}`,
      ORDERBOOK,
      INR_BALANCES,
    });
  }
    // Determine the sides of the order book
    const sellSide =
    type === "yes" ? ORDERBOOK[stockSymbol].no : ORDERBOOK[stockSymbol].yes;

  // If no match is found, create a pseudo sell order
  let newprice= capprice-price
  const pseudoUserId = `pseudo${userId}`;
  if (!sellSide[newprice]) {
    sellSide[newprice] = { total: 0, orders: {} };
  }
  sellSide[newprice].orders[pseudoUserId] =
    (sellSide[newprice].orders[pseudoUserId] || 0) + quantity;
  sellSide[newprice].total += quantity;
  //sort the order book after adding the new order
  let newOrderSide = type==="yes"?"no":"yes"
  sortOrderBook(stockSymbol,newOrderSide)

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
  // Check if the stockSymbol exists in the ORDERBOOK
  if (!ORDERBOOK[stockSymbol]) {
    console.error(`Stock symbol ${stockSymbol} not found in ORDERBOOK`);
    return false;
  }

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
      if (!STOCK_BALANCES[userId]) {
        STOCK_BALANCES[userId] = {};
      }
      if (!STOCK_BALANCES[userId][stockSymbol]) {
        STOCK_BALANCES[userId][stockSymbol] = {
          yes: { quantity: 0, locked: 0 },
          no: { quantity: 0, locked: 0 },
        };
      }
      STOCK_BALANCES[userId][stockSymbol][type].quantity += matchedQuantity;
      
      //relaease the locked funds
      INR_BALANCES[userId].locked -= matchedQuantity * parseInt(sellPrice);

      // Deduct the matched quantity from the sell orders
      availableOrders.total -= matchedQuantity;
      for (const sellerId in availableOrders.orders) {
        const sellerQuantity = availableOrders.orders[sellerId];
        const toDeduct = Math.min(sellerQuantity, matchedQuantity);

        STOCK_BALANCES[sellerId][stockSymbol][type].locked -= toDeduct;
        
        if (!INR_BALANCES[sellerId]) {
          INR_BALANCES[sellerId] = { balance: 0, locked: 0 };
        }
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

  if (!ORDERBOOK[stockSymbol]) {
    return res
      .status(400)
      .json({ message: `Market for ${stockSymbol} does not exist` });
  }

  const matched = matchOrders(stockSymbol, price, quantity, userId, type);
  
  if (matched) {
    return res.status(200).json({
      message: `Sell order matched for ${quantity} ${type} at price ${price}`,
      ORDERBOOK,
      STOCK_BALANCES,
    });
  }

  return res.status(201).json({
    message: `Sell order placed for ${quantity} ${type} at price ${price}`,
    ORDERBOOK,
    STOCK_BALANCES,
  });
});

function sortOrderBook(stockSymbol:string,type:string){
    const sortSide = ORDERBOOK[stockSymbol][type]
    const sortedKeys = Object.keys(sortSide).sort((a,b)=>parseInt(a)-parseInt(b))
    .reduce((acc,price)=>{
        acc[price] = sortSide[price]
        return acc
    },{} as {[key: string]: any})
    ORDERBOOK[stockSymbol][type] = sortedKeys
}



app.listen(4001, () => {
  console.log("server is running on port 4001");
});

export default app;
