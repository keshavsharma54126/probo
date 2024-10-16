import express from "express";
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
    "user1": {
        balance: 10,
        locked: 0
     },
     "user2": {
        balance: 20,
        locked: 10
     }
    }

let ORDERBOOK :any = {
    "BTC_USDT_10_Oct_2024_9_30": {
        "yes": {
            "9.5": {
                "total": 12,
                orders: {
                    "user1": 10,
                    "user2": 2
                }
            },
            "8.5": {
                "total": 12,
                "orders": {
                    "user1": 3,
                    "user2": 6,
                    "user3": 3,
                }
            },
        },
        "no": {
            "7.5": {
                "total": 12,
                "orders": {
                    "user1": 3,
                    "user2": 2,
                    "user3": 7,
                }
            }
        
        }
    }
};

let STOCK_BALANCES:any = {
    user1: {
        "BTC_USDT_10_Oct_2024_9_30": {
            "yes": {
                "quantity": 1,
                "locked": 0
            }
        }
     },
     user2: {
         "BTC_USDT_10_Oct_2024_9_30": {
            "no": {
                "quantity": 3,
                "locked": 4
            }
        }
     }
};
let pendingState = [];

app.post("/reset", async(req:any, res:any) => {
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

app.post("/user/create/:userId", (req:any, res:any) => {
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

app.post("/symbol/create/:stockSymbol", (req:any, res:any) => {
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
app.get("/orderbook", (req:any, res:any) => {
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
app.get("/balances/inr", (req:any, res:any) => {
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

app.get("/balances/stock", (req:any, res:any) => {
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

app.get("/balance/inr/:userId", (req:any, res:any) => {
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

app.post("/onramp/inr", async(req:any, res:any) => {
  try {
    const body =await req.body;
    console.log(body)
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

app.get("/balance/stock/:userId", (req:any, res:any) => {
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
app.get("/orderbook/:stockSymbol", (req:any, res:any) => {
    const{stockSymbol} = req.params
    try{
        if(!ORDERBOOK[stockSymbol]){
           return res.json({
                message:`${stockSymbol} not found in order book`
            })
        }
        return res.json({
           orderbook: ORDERBOOK[stockSymbol]
        })

    }catch(err){
        return res.json({
            message:`could not get the order book for the ${stockSymbol}`
        })
    }
});
app.post("/order/buy", async(req:any, res:any) => {
  try {
    const { userId, stockSymbol, quantity, price, type } = await req.body;
  } catch (err) {
    return res.json({
      mesage: "could not buy the yes order for the stock",
    });
  }
});
app.post("order/sell", (req, res) => {});


app.post("/trade/mint", (req, res) => {
  const {  stockSymbol, quantity } = req.body;
});

app.listen(4001,()=>{
    console.log("server is running on port 4001")
});

export default app;
