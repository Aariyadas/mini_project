const express = require('express')
const user_route = express()
const userController = require('../controllers/userController')
const userAuth=require('../middleware/userAuth')
let isLoggedin
isLoggedin =false
let userSession =false|| {}


const multer=require('multer');
const path=require('path');
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/assets/upload'));
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name)
    }
});
 const upload=multer({storage:storage});




user_route.get('/', userController.loadLanding)

user_route.get('/login',userAuth.isLogout ,userController.loadLogin)

user_route.post('/login', userController.verifyLogin)
user_route.get('/logout',userAuth.isLogin,userController.userLogout)

user_route.get('/register',userAuth.isLogout,userController.loadRegister)

user_route.post('/register', userController.insertUser)

user_route.get('/verifyOtp', userController.loadOtp)
user_route.post('/verifyOtp', userController.verifyOtp)

user_route.get('/home', userController.loadHome)

user_route.get('/viewProduct',userController.loadShop)
user_route.get('/singleProduct',userController.singleProduct)
user_route.get('/categoryProduct',userController.getCategoryProduct)

user_route.get('/cart',userAuth.isLogin,userController.loadCart)
user_route.get('/addtocart',userController.addToCart)
user_route.get('/deletecart',userAuth.isLogin,userController.deleteCart)
user_route.post('/editUser',  userController.editUser);
user_route.post('/add-coupon',userController.addCoupon);
user_route.post("/changeProductQnty",userController.changeProductQnty)

user_route.get('/wishlist',userController.loadWishlist)
user_route.get('/addToWishlist',userController.addToWishlist)
user_route.get('/deleteWishlist',userController.deleteWishlist)
user_route.get('/addtocart-deletewishlist',userController.addCartdelWishlist)



user_route.get('/dashboard', userAuth.isLogin, userController.userDashboard)
user_route.get('/viewOrder', userAuth.isLogin, userController.viewOrder)
user_route.get('/cancelOrder', userAuth.isLogin, userController.cancelOrder)
user_route.get('/cancelProduct', userAuth.isLogin, userController.returnProduct)

user_route.post('/addAddress',  userController.addAddress)
user_route.get('/deleteAddress', userAuth.isLogin, userController.deleteAddress)
user_route.post('/addCoupon', userAuth.isLogin, userController.addCoupon)
 
user_route.get('/checkout',userController.loadCheckout)
user_route.post('/checkout',  userController.storeOrder)

user_route.post('/razorpay', userController.razorpayCheckout)
user_route.get('/orderSuccess', userAuth.isLogin, userController.loadSuccess)

user_route.get('/forgotpassword', userController.userForgotPassword)
user_route.post('/forgotpassword', userController.checkUser)
user_route.post('/forgotpasswordotp', userController.sentOtp)
user_route.post('/forgotpasswordchange', userController.changepassword)















module.exports = user_route