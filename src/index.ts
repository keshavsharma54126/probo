import express from "express"
const app = express()

app.use(express.json())
interface INR_BALANCES{
    [key:string]:{
        balance:number,
        locked:number,
    }
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

const INR_BALANCES:INR_BALANCES = {
   
  };

  const ORDERBOOK = {
   
 }

 const STOCK_BALANCES = {
	
}
const pendingState = []

app.post("/user/create/:userId", (req, res) => {
    try{
        const {userId} = req.params;
        if(INR_BALANCES[userId  ]){
            res.status(400).json({
                message:"user already existe"
            })
        }
        
        INR_BALANCES[userId]={
            balance:0,
            locked:0,
        }
        res.json({
            message:"user created successfully",
            INR_BALANCES
        })
    }catch(err){
        res.status(500).json({
            message:"user creation failed"
        })
    }
})

app.post("/symbol/create/:stockSymbol",(req,res)=>{
    try{
        const {stockSymbol}= req.params;
        if(ORDERBOOK[stockSymbol as keyof typeof ORDERBOOK]){
            res.status(400).json({
                message:"symbol already present"
            })
        }
        //@ts-ignore 
        ORDERBOOK[stockSymbol]={
            yes:{},
            no:{}
        }
        //@ts-ignore
        res.json({
            message:"symbol added in order book successfully",
            ORDERBOOK
        })

    }catch(err){
        res.status(500).json({
            message:"failed to create symbol"
        })
    }
})
app.get("/orderbook",(req,res)=>{
    try{
        res.json({
            ORDERBOOK
        })
    }catch(err){
        res.status(500).json({
            message:"failed to get order  book"
        })
    }
})
app.get("/balances/inr",(req,res)=>{
    try{
        res.json({
            INR_BALANCES
        })
    }catch(err){
        res.status(500).json({
            message:"failed to get inr balances"
        })
    }
})

app.get("/balances/stock",(req,res)=>{
    try{
        res.status(200).json({
            STOCK_BALANCES
        })

    }catch(err){
        res.status(500).json({
            message:"failed to get the stock balances"
        })
    }
})

app.get("/balance/inr/:userId",(req,res)=>{
    try{
        const{userId}= req.params;
        if(!INR_BALANCES[userId]){
            res.status(400).json({
                message:"user not found"
            })
        }
        const userBalance={
            "userId":userId,
            "balance":INR_BALANCES[userId].balance,
        }
        res.json(userBalance)
    }catch(err){
        res.status(500).json({
            message:"failed to get the inr balance for user"
        })
    }
})

app.post("/onramp/inr",(req,res)=>{
   try{
    const {userId,balance}=req.body;
    if(!INR_BALANCES[userId]){
        res.status(400).json({
            message:"user not found"
        })
    }
    INR_BALANCES[userId].balance+=balance;
    res.json({
        message:"INR onramp successfull",
        INR_BALANCES
    })
   }catch(err){
    res.status(500).json({
        message:"failed to create onramp inr"
    })
   }
})


app.get("/balance/stock/:userId",(req,res)=>{
    try{
        const {userId} = req.params;
        //@ts-ignore
        if(!STOCK_BALANCES[userId]){
            res.status(400).json({
                message:"user not found"
            })
        }
        //@ts-ignore
        res.json(STOCK_BALANCES[userId])
    }catch(err){
        res.status(500).json({
            message:"failed to get the stock balance for user"
        })
    }
})
app.post("/order/buy",(req,res)=>{
    try{
        const{userId,stockSymbol,quantity,price,type} = req.body



    }catch(err){
        res.json({
            mesage:"could not buy the yes order for the stock"
        })
    }
})
app.post("order/sell",(req,res)=>{

    
})


app.get("/orderbook/:stockSymbol",(req,res)=>{

})
app.post("/trade/mint",(req,res)=>{
    const{userId,stockSymbol,quantity} = req.body;
    
})

export default app;

    app.listen(4001, () => {
      console.log('Server is running on port 4001');
    });
  




// Keep this at the end of the file


