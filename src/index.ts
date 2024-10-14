import express from "express"
const app = express()
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

app.post("/symbol/create/:symbol",(req,res)=>{
    try{
        const {symbol}= req.params;
        if(ORDERBOOK[symbol as keyof typeof ORDERBOOK]){
            res.status(400).json({
                message:"symbol already present"
            })
        }
        //@ts-ignore 
        ORDERBOOK[symbol]={
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


app.listen(4001,()=>{
    console.log("Server is running on port 4001")
})
