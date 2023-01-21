const express = require("express");
const admin_route = express();

const session = require("express-session");
// const config = require("../config/config");
const Category = require('../models/categoryModel')



const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

 const adminMiddleware=require("../middleware/adminAuth");



const adminController = require("../controllers/adminController");
const multer=require('../util/multer');


admin_route.get('/',adminMiddleware.isLogout, adminController.loadLogin);
admin_route.post('/', adminController.verifyLogin);

admin_route.get('/home',adminMiddleware.isLogin, adminController.loadDashboard);
admin_route.get('/logout', adminController.isLogout);
admin_route.get('/userlist',adminMiddleware.isLogin, adminController.userList);
admin_route.get('/blockUsers', adminController.blockUser)
admin_route.get('/adminProduct',adminMiddleware.isLogin, adminController.viewProduct)
admin_route.get('/viewProduct',adminMiddleware.isLogin, adminController.viewProduct)
admin_route.get('/editProduct/' ,adminController.editProduct)

admin_route.get('/addProduct',adminMiddleware.isLogin, adminController.addProductLoad)

admin_route.post('/addProduct', multer.upload.array("uploaded_file"), adminController.updateAddProduct)
admin_route.post('/editProduct/:id',  adminController.updateEditProduct)

admin_route.get('/blockProduct', adminController.blockProduct)
admin_route.get('/showProduct',adminMiddleware.isLogin, adminController.showProduct)

admin_route.get('/adminCategory',adminMiddleware.isLogin, adminController.viewCategory)
admin_route.post('/adminCategory', adminController.addCategory)
admin_route.get('/deleteCategory', adminController.deleteCategory) 
admin_route.get('/edit-category', adminController.editCategory)
admin_route.post('/edit-category/:id', adminController.updateCategory)


admin_route.get('/adminOrder',adminMiddleware.isLogin,adminController.viewOrder)
admin_route.post("/adminOrder",adminController.updateOrderStatus)




admin_route.get('/loadBanners',adminController.getBanners)
admin_route.post('/loadBanners',multer.upload.array('bannerImage',2),adminController.addBanner)
admin_route.get('/currentBanner',adminController.currentBanner)


admin_route.get('/admin-offer',adminMiddleware.isLogin,adminController.adminLoadOffer);
admin_route.post('/admin-offer',adminController.adminAddOffer);
admin_route.get('/couponlist', adminController.loadCoupon)
admin_route.get('/show-coupon', adminController.showCoupon)
admin_route.get('/block-coupon', adminController.blockCoupon)

admin_route.get("/orderDownload",adminController.orderDownload);







admin_route.get('*', function (req, res) {
    res.redirect('/admin');
})


module.exports = admin_route;




