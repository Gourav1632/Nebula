import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

async function getBinanceBTCPrice() {
  try {
    const response =  await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: {
        symbol: 'BTCUSDT', // Change to other trading pairs if needed
      },
    });

    btcPrice = response.data.price;
    console.log(btcPrice)
  } catch (error) {
    console.error('Error fetching Binance BTC price:', error.message);
  }

}


let user = {
    name:"",
    email:"",
    password:""
};
let order = {
    symbol:"BTCUSDT",
    side:"BUY",
    size:1,
    entryPrice:51602.5,
    markPrice:52034.3,
    pnl:431.8
}
let balance = 0;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Nebula",
    password: "12345678",
    port: 5432,
  });
  db.connect();
  

const  app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.get("/user",(req,res)=>{
    res.render("user.ejs",{name:user.name})
})

app.get("/market",async(req,res)=>{
    try {
        const result = await db.query("SELECT * FROM orders where email = ($1)",[user.email]);
        let items = result.rows;
        balance = items[0].balance
        res.render("market.ejs",{balance:balance})
    }catch (err) {
        console.log(err);
      }
})
app.post("/market",async(req,res)=>{
    order.size = req.body.amount
    balance = balance - order.entryPrice*order.size
    order.pnl = (order.markPrice - order.entryPrice)*order.size;
    res.render("market.ejs",{balance:balance,ep:order.entryPrice,size:order.size,pnl:order.pnl,symbol:order.symbol,mp:order.markPrice})

})

app.get("/register",(req,res)=>{
    res.render("register.ejs")
})

app.post("/register",async (req,res)=>{
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    let pwd = req.body.confirm_password; 
    if(pwd === user.password){
        try {
            const result = await db.query("SELECT * FROM username where email = ($1)",[user.email]);
            let items = result.rows;
            let rowCount = result.rows.length
            if(rowCount>0){
                res.render("register.ejs", {error:"Account already exists."});
            }else{
                try {
                    await db.query("INSERT INTO username (name,email,password) VALUES ($1,$2,$3)", [user.name,user.email,user.password]);
                    try {
                        await db.query("INSERT INTO orders (email,balance) VALUES ($1,$2)", [user.email,10000]);;
                      } catch (err) {
                        console.log(err);
                      }
                    res.redirect("/user");
                  } catch (err) {
                    console.log(err);
                  }
            } 
          } catch (err) {
            console.log(err);
          }

        }else{
            res.render("register.ejs",{error:"Password does not match."})
        } 

})

app.get("/signUp",(req,res)=>{
    res.render("signUp.ejs");
})
app.post("/signup",async(req,res)=>{
    user.email = req.body.email
    user.password = req.body.password
    try {
        const result = await db.query("SELECT * FROM username where email = ($1)",[user.email]);
        let items = result.rows;
        let rowCount = result.rows.length
        if(rowCount>0){
            if(items[0].password === user.password){
                user.name = items[0].name
                res.redirect("/user")
            }else{
                res.render("signUp.ejs",{error:"Incorrect Password."})
            }
        }else{
            res.render("signUp.ejs",{error:"Account does not exists."})
        }
    } catch (err) {
        console.log(err);
      }
})
app.post("/user",(req,res)=>{
    user.email
    res.render("user.ejs")
})

app.listen(3000,(req,res)=>{
    console.log("Listening on port 3000.")
})