import express from "express";
import { RedisManager } from "./redisManager.js";
import * as fromengine from "./types/from.js";
import * as toengine from "./types/to.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

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

app.listen(4001, () => {
  console.log("server is running on port 4001");
});

export default app;
