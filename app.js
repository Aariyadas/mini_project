const mongoose = require('mongoose')
require('dotenv').config()

DB = process.env.DBURL

mongoose.connect(DB,()=>{
  console.log("connection is successfull");
})



const express = require('express')
const app = express()
const session = require('express-session')
const path = require('path')
const user_route = require('./routes/userRoute')
const admin_route = require('./routes/adminRoute')
const Product=require('./models/productModel')


app.use(function (req, res, next) {
    res.set(
      "cache-control",
      "no-cache,private,no-store,must-revalidate,max-stale=0,pre-check=0"
    );
    next();
  });
app.use(session({ secret: "secretkey", resave: true, saveUninitialized: true }))


admin_route.set('view engine', 'ejs')
admin_route.set('views','./views/admin')
admin_route.use('/',express.static('public'))
admin_route.use('/admin', express.static('public/admin'))

user_route.set('view engine', 'ejs')
user_route.set('views','./views/user')
user_route.use('/',express.static('public'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))




app.use('/', user_route)


app.use('/admin', admin_route)

app.get("*",function(req,res){
  res.status(404).render("404page.ejs")
})

app.listen(3000, function () {
    console.log("server is running...")
})

