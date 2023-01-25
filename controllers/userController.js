const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const productModel = require("../models/productModel");
const fast2sms = require("fast-two-sms");
const Category = require("../models/categoryModel");
const Address = require("../models/adressModel");
const Orders = require("../models/orderModel");
const Banner = require("../models/bannerModel");
const Coupon = require("../models/couponModel");

const Razorpay = require("razorpay");
const { ObjectID } = require("bson");
const cors = require("cors");

let isLoggedIn;
isLoggedIn = false;
 let userSession = false || {}
// let userSession
let offer = {
  name: 'None',
  type: 'None',
  discount: 0,
  usedBy: false
}
let couponTotal=0
let noCoupon;
let newUser;
let newOtp;

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
const sendMessage = function (mobile, res) {
  let randomOTP = Math.floor(Math.random() * 10000);
  var options = {
    authorization:
      process.env.API_KEY,
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile],
  };
  //send this message
  fast2sms
    .sendMessage(options)
    .then((response) => {
      console.log("otp sent successfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return randomOTP;
};

const loadOtp = async (req, res) => {
  const userData = await User.findById({ _id: newUser });
  const otp = sendMessage(userData.mobile, res);
  newOtp = otp;
  console.log("otp:", otp);
  res.render("../otpVerify", { otp: otp, user: newUser });
};
const verifyOtp = async (req, res) => {
  try {
    const otp = newOtp;
    const userData = await User.findById({ _id: req.body.user });
    if (otp == req.body.otp) {
      userData.is_verified = 1;
      const user = await userData.save();
      if (user) {
        res.redirect("/login");
      }
    } else {
      res.render("../otpVerify", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadLanding = async (req, res) => {
  try {
    console.log("This is my landing page");

    const banner = await Banner.find({ is_active: 1 });
    const category = await Category.find()
    const userSession = req.session
    const id = req.session.userId;
    if (id) {
      userSession.offer=offer
      userSession.couponTotal=couponTotal
      var userData = await User.find({ _id: id });
      var cartLength = userData[0].cart.item.length;
      var userName = req.session.userName;
      
    }
    res.render("home", {
      isLoggedIn,
      banners: banner,
      length: cartLength,
      userName,
      category,
      id:userSession.userId
    });
  } catch (error) {
    console.log(error.message);
  }
};
const loadLogin = async (req, res) => {
  try {
    console.log("this is my login");
    res.render("login", { isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("register", { isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      cpassword: req.body.cpassword,
    });
    
    const userData = await user.save();
    newUser = userData._id;
    console.log(userData);
    if (userData) {
      res.redirect("/verifyOtp");
    } else {
      res.render("register", { message: "Registration Failure" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  
  try {
    
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render("login", { message: "This User is blocked" });
        } else {
          if (userData.is_admin === 1) {
            
            res.render("register", { message: "Not an user" });
          } else {
            userSession = req.session;
            userSession.userId = userData._id; //islogged=true;
            req.session.userName = userData.name;
            console.log(userSession.userId);
            isLoggedIn = true;

            res.redirect("/");
            console.log("logged in");
          }
        }
      } else {
        res.render("login", { message: "email and password are incorrect" });
      }
    } else {
      res.render("login", { message: "user not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    res.render("home", { isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
};
const userLogout = async (req, res) => {
  try {
    userSession = req.session;
    userSession.userId = null;
    isLoggedIn = false;
    
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};



const getCategoryProduct = async (req, res) => {
    try {
      
      
        const userId = req.session.userId;
        if(userId){
          isLoggedIn=true
        }else{
          isLoggedIn=false
        }
        var userName = req.session.userName;
        const userData = await User.find({ _id: userId });
        const categor = req.query.category;
        
    
        const category = await Category.find()
        const products = await productModel.find({ category: categor });
        
        console.log(products);
        res.render("categoryProduct", { category, products, categor, userData,userName,isLoggedIn
          });
    } catch (error) {
        console.log(error.message);
    }
}

const singleProduct = async (req, res) => {
  try {
    userSession = req.session;
    console.log(userSession.userId);
    const id = req.query.id;
    const products = await productModel.find();
    const category = await Category.find()
    const productData = await productModel.findOne({ _id: id });
    var userData = await User.find({ _id: userSession.userId });
    var userName = req.session.userName;
    console.log(userData)
    // var cartLength = userData[0].cart.item.length;
    if (productData) {
      res.render("singleProduct", {
        isLoggedIn,
        product: productData,
        products: products,
        userSession: userSession.userId,
        id: id,
        category,
        userName
        // length: cartLength,
      });
    } else {
      res.redirect("/viewProduct");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadCart = async (req, res) => {
  console.log("loadcart");
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      var userName = req.session.userName;
      const completeUser = await userData.populate("cart.item.productId");
      const category = await Category.find()
      var cartLength = userData.cart.item.length;
      const couponData=await Coupon.find()
      console.log(couponData)
      noCoupon=false
      if(userSession.couponTotal == 0) {
        userSession.couponTotal = userData.cart.totalPrice
        
    }
    
      
      res.render("cart", {
        isLoggedIn: true,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        length: cartLength,
        category,
        userName,
        offer:userSession.offer,
        couponTotal:userSession.couponTotal,
        noCoupon,
        couponData

      });
    } else {
      
      res.render("home", { isLoggedIn: false, id: userSession.userId,category,offer:userSession.offer,couponTotal:userSession.couponTotal,noCoupon,couponData});
    }
  } catch (error) {
    console.log(error);
  }
};
const addToCart = async (req, res, next) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    if (userSession) {
      const userData = await User.findById({ _id: userSession.userId });
      const productData = await productModel.findById({ _id: productId });
      userData.addToCart(productData);
      res.redirect("/cart");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteCart = async (req, res, next) => {
  console.log("delete ctarts");
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    userData.removefromCart(productId);
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
  }
};

const addCoupon = async (req,res) =>{
  try {
      userSession = req.session
      if(userSession.userId) {
          console.log('user id '+userSession.userId)
          
          const userData = await User.findById({_id:userSession.userId})
          const completeUser = await userData.populate("cart.item.productId");
          const offerData = await Coupon.findOne({name:req.body.offer})
          const couponData =await Coupon.find()

         //
        //  let offername = req.body.offer
          // console.log("coupon name :"+ offername)
          // console.log(offerData)
          if(offerData){
              console.log(offerData)

              if(offerData.usedBy != userSession.userId) {
                console.log(userSession);
                noCoupon=false
                  userSession.offer.name = offerData.name
                  userSession.offer.type  = offerData.type
                  userSession.offer.discount  = offerData.discount
                  let updatedTotal = userData.cart.totalPrice - (userData.cart.totalPrice*userSession.offer.discount)/100

                  userSession.couponTotal = updatedTotal
                  res.render('cart',{isLoggedIn: true,
                    id: userSession.userId,
                    cartProducts: completeUser.cart,
                    
                  couponData,
                    offer:userSession.offer,
                    couponTotal:userSession.couponTotal,
                    noCoupon:false
            })

              } else {
                noCoupon=true
                  userSession.offer.usedBy = true
                  res.render('cart',{noCoupon:true,isLoggedIn: true,
                    id: userSession.userId,
                    cartProducts: completeUser.cart,
                    couponData,
                  
                    offer:userSession.offer,
                    couponTotal:userSession.couponTotal})              }

          } else {
              res.redirect('/cart')
          }
      } else {
          res.redirect('/cart')
      }

  } catch (error) {
      console.log(error.message)
  }
}




const changeProductQnty = async (req, res) => {
  try {
      const id = req.query.id;
      console.log(id);
      const userData = await User.findById({ _id: req.session.userId });
    console.log(userData);
      const foundProduct = userData.cart.item.findIndex((x) => x.productId == id);
      console.log(foundProduct);
      const qty = { a: parseInt(req.body.qty) };
      console.log(qty);
      console.log(userData.cart.item[foundProduct].qty );
      userData.cart.item[foundProduct].qty = qty.a;
      
      const price = userData.cart.item[foundProduct].price;
      userData.cart.totalPrice = 0;

      const totalPrice = userData.cart.item.reduce((acc, curr) => {
          return acc + curr.price * curr.qty;
      }, 0);
      userData.cart.totalPrice = totalPrice;
      await userData.save();
      res.json({ totalPrice, price });
  } catch (error) {
      console.log(error.message);
  }
};


const loadWishlist = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      var userName = req.session.userName;
      const category = await Category.find()
      
      var cartLength = userData.cart.item.length;
     
      const completeUser = await userData.populate("wishlist.item.productId");
      
      console.log(completeUser);
      res.render("wishlist", {
        isLoggedIn,
        id: userSession.userId,
        wishlistProducts: completeUser.wishlist,
        length: cartLength,
        category,
        userName
      });
    } else {
      res.render("wishlist", { isLoggedIn, id: userSession.userId,userName});
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToWishlist = async (req, res) => {
  const productId = req.query.id;
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const productData = await productModel.findById({ _id: productId });
  userData.addToWishlist(productData);
  res.redirect("/viewProduct");
};

const addCartdelWishlist = async (req, res) => {
  const productId = req.query.id;
  
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const productData = await productModel.findById({ _id: productId });
  const add = await userData.addToCart(productData);
  
  if (add) {
    await userData.removefromWishlist(productId);
    res.redirect("/cart");
  }
};

const deleteWishlist = async (req, res) => {
  const productId = req.query.id;
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  userData.removefromWishlist(productId);
  res.redirect("/wishlist");
};

const userDashboard = async (req, res) => {
  try {

    userSession = req.session
    console.log(userSession);
    const id=req.session.userId
    // .sort({createdAt:-1})
    const orderData = await Orders.find({ userId:id}).sort({createdAt:-1});
    console.log('alan');
   console.log(orderData)
    const userData = await User.findById({ _id: userSession.userId });
    const addressData = await Address.find({ userId: userSession.userId });
    const category = await Category.find()
    var cartLength = userData.cart.item.length;

    var userName = req.session.userName;
    res.render("dashboard", {
      isLoggedIn:true,
      user: userData,
      userAddress: addressData,
      userOrders: orderData,
      
      id: userSession.userId,
      category,
      length: cartLength,
      userName

    });
  }  catch (error) {
    console.log(error.message)
  }
}
 

const viewOrder = async (req, res) => {
  try {
    console.log('alan');
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.id;
      console.log(id);
      userSession.currentOrder = id;
      const orderData = await Orders.findById({ _id: id })
       console.log(orderData)
      const userData = await User.find({ id: userSession.userId });
      await orderData.populate("products.item.productId");
      res.render("viewOrder", {
      
        order: orderData,
        user: userData,

      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// const viewOrder = async (req, res) => {
//   try {
//     userSession = req.session;
//     if (userSession.userId) {
//       const id = req.query.id;
//       userSession.currentOrder = id;
//       const orderData = await Orders.findById({ _id: id });
//       const userData = await User.find({ id: userSession.userId });
//       await orderData.populate("products.item.productId");
//       res.render("viewOrder", {
//         isLoggedIn,
//         order: orderData,
//         user: userData,
//       });
//     } else {
//       res.redirect("/login");
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const cancelOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.id;
      await Orders.deleteOne({ _id: id });
      res.redirect("/viewOrder");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};



const returnProduct = async (req, res) => {
  try {
    userSession = req.session;
    if ((userSession = req.session)) {
      const id = req.query.id;
     console.log(id)

      const productOrderData = await Orders.findById({
        _id: ObjectID(userSession.currentOrder),
      });
      const productData = await productModel.findById({ _id: id });
      if (productOrderData) {
        for (let i = 0; i < productOrderData.products.item.length; i++) {
          if (
            new String(productOrderData.products.item[i].productId).trim() ===
            new String(id).trim()
          ) {
            productData.quantity += productOrderData.products.item[i].qty;
            productOrderData.productReturned[i] = 1;
            await productData.save().then(() => {
              console.log("productData saved");
            });

            await productOrderData.save().then(() => {
              console.log("productOrderData saved");
            });
          } else {
          }
        }
        res.redirect("/dashboard");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};


const addAddress = async (req, res) => {
  try {
    userSession = req.session;
    const addressData = Address({
      userId: userSession.userId,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      address: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      mobile: req.body.mno,
    });
    await addressData.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    userSession = req.session;
    id = req.query.id;
    await Address.findByIdAndDelete({ _id: id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const editUser = async (req, res) => {
  try {
    userSession = req.session;
    const password1 = req.body.password1
    const password2 = req.body.password2
    const password3 = req.body.password3
    console.log('userSession : '+userSession.userId)
    const userData = await User.findById({_id : userSession.userId})
    if (userData) {
      const passwordMatch = await bcrypt.compare(password1, userData.password)
      if (passwordMatch) {
        if(password2 === password3){
        const spassword = await securePassword(req.body.password2)
      await User.findByIdAndUpdate(
        { _id: userSession.userId },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: spassword
          },
        }
      );
      res.redirect('/dashboard');
    }}}
  } catch (error) {
    console.log(error.message);
  }
};
const loadCheckout = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.addressid;
      console.log(id);
      const userData = await User.findById({ _id: userSession.userId });
      var userName = req.session.userName;
      const completeUser = await userData.populate("cart.item.productId");
      const addressData = await Address.find({ userId: userSession.userId });
      const selectAddress = await Address.findOne({ _id: id });
      const category = await Category.find()
      var cartLength = userData.cart.item.length;
     
    

      console.log(selectAddress);
      

      if (userSession.couponTotal == 0) {
        //update coupon
        userSession.couponTotal = userData.cart.totalPrice;
      }

      res.render("checkout", {
        isLoggedIn,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        addSelect: selectAddress,
        couponTotal:userSession.couponTotal,
        userAddress: addressData,
        category,
        userName,
        length:cartLength
      });
    } else {
      res.render("checkout", { isLoggedIn, id: userSession.userId,userName,cartLength,addSelect:false,userAddress:false,couponTotal:false,cartProducts:false });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const storeOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
      

      if (completeUser.cart.totalPrice > 0) {
        const order = Orders({
          userId: userSession.userId,
          payment: req.body.payment,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          mobile: req.body.phone,
          products: completeUser.cart,
          offer: userSession.offer,
          discount: userSession.offer.discount,
          amount:completeUser.cart.totalPrice
        });
       
        const orderProductStatus = [];
        for (const key of order.products.item) {
          orderProductStatus.push(0);
        }
        order.productReturned = orderProductStatus;

        const orderData = await order.save();
        
        console.log(orderData);
        userSession.currentOrder = orderData._id;

        req.session.currentOrder = order._id;

        const ordern = await Orders.findById({ _id: userSession.currentOrder });
        const productDetails = await productModel.find({ is_available: 1 });
        for (let i = 0; i < productDetails.length; i++) {
          for (let j = 0; j < ordern.products.item.length; j++) {
            if (
              productDetails[i]._id.equals(ordern.products.item[j].productId)
            ) {
              productDetails[i].sales += ordern.products.item[j].qty;
            }
          }
          productDetails[i].save();
        }

          const offerUpdate = await Coupon.updateOne(
            { name: userSession.offer.name },
            { $push: { usedBy: userSession.userId } }
          )
        
        console.log(req.body.payment);
      
        if (req.body.payment == "Cash-on-Dilevery") {
          
          res.redirect("/orderSuccess");
        } else if (req.body.payment == "RazorPay") {
          res.render("razorpay", {
            isLoggedIn,
            userId: userSession.userId,
            total: completeUser.cart.totalPrice,
          });
        } else {
          res.redirect("/checkout");
        }
      } else {
        res.redirect("/viewProduct");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const razorpayCheckout = async (req, res) => {
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const completeUser = await userData.populate("cart.item.productId");
  var instance = new Razorpay({
    key_id:process.env.key_id,
    key_secret:process.env.key_secret,
  });
  console.log(req.body);
  console.log(completeUser.cart.totalPrice);
  let order = await instance.orders.create({
    amount: completeUser.cart.totalPrice * 100,
    currency: "INR",
    receipt: "receipt#1",
  });
  res.status(201).json({
    success: true,
    order,
  });
};

const loadSuccess = async (req, res) => {
  try {

    userSession = req.session;

    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const productData = await productModel.find();
      for (const key of userData.cart.item) {
        // console.log(key.productId, ' + ', key.qty)
        for (const prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.quantity = prod.quantity - key.qty;
            await prod.save();
          }
        }
      }
      // await Orders.updateOne({
      //   userId: userSession.userId,
      // });
      // userId: userSession.userId,
      await Orders.updateOne(
        {  _id: userSession.currentOrder },
        { $set: { status: "Build" } }
      );
      await User.updateOne(
        { _id: userSession.userId },
        {
          $set: {
            "cart.item": [],
            "cart.totalPrice": "0",
          },
        },
        { multi: true }
      );
      console.log("Order Built and Cart is Empty.");
    }
    userSession.couponTotal = 0;
    res.render("orderSuccess", {
      orderId: userSession.currentOrder,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const currentBanner = async (req, res) => {
  try {
    const id = req.query.id;
    await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } });
    await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } });
    res.redirect("/admin/loadBanners");
  } catch (error) {
    console.log(error.message);
  }
};



const userForgotPassword = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      if (userData.is_verified === 1) {
        res.render('home',)
      } else {
        res.render('login')
      }
    } else {
      res.render('forgotpassword', { isLoggedIn: false, forgotpassword: true, checkuser: false, otp: false, user: false, changepassword: false })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const checkUser = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      res.render('home')
    } else {
      const email = req.body.email
      userEmail = email
      const userDataOne = await User.findOne({ email: email })
      userOne = userDataOne
      if (userDataOne) {
        const otp = sendMessage(userDataOne.mobile, res)
        newOtp = otp
        console.log('otp:', otp)
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: true, otp: false, user: false, changepassword: false })
      } else {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: true, checkuser: false, otp: false, user: false, message: 'User not found', changepassword: false })
      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const sentOtp = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      res.render('home')
    } else {
      const otp = newOtp
      console.log(otp)
      const userData = req.body.user
      const otpBody = req.body.otp
      if (otpBody == otp) {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: false, otp: true, user: userData, changepassword: true })
      } else {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: true, otp: false, user: userData, changepassword: false, message: 'Invalid Otp' })

      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const changepassword = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      res.render('home')
    } else {
      const password1 = req.body.password1
      const password2 = req.body.password2
      const user = userEmail
      console.log('userEmail: ' + user)
      if (password1 === password2) {
        const sPassword = await securePassword(password1)
        console.log('sPassword')
        const userData = await User.findOneAndUpdate({ email: user }, {
          $set: {
            password: sPassword
          }
        })
        if (userData) {
          res.redirect('login')
        }
      } else {
        res.render('forgotpassword', { isLoggedIn: false, forgotpassword: false, checkuser: true, otp: false, user: userData, changepassword: false, message: 'Passwords mismatch' })
      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadShop = async (req, res) => {
  try {
    userSession = req.session
    const id = userSession.userId;
    if(id){
    const userData=await User.findById({_id:id})
    var cartLength = userData.cart.item.length;
    
    console.log(userData.name)
    isLoggedIn=true
    }else{
      isLoggedIn=false
    }
  
    let search = ''
    if (req.query.search) {
      search = req.query.search
    }
    let page = 1
    if (req.query.page) {
      page = req.query.page
    }
    const limit = 6
    
    const productShop = await productModel.find({
      is_available: 1,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    const count = await productModel.find({
      is_available: 1,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    }).countDocuments()

    const categoryData = await Category.find({is_active: 1})
    
    const ID = req.query.id
    // console.log(categoryData)

    const data = await Category.findOne({ _id: ID })
    const category = await Category.find()
    if (data) {
      const productData = await productModel.find({ category: data.name })
      console.log(productData)
      res.render('viewProduct', {
        // products: productData,
        productShop,
        isLoggedIn,
        cat: categoryData,
        category,
        length:cartLength,
         userName:userData.name,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1
      })
    } else {
      // const productData = await Product.find()
      res.render('viewProduct', {
        isLoggedIn,
        cat: categoryData,
        // products: productData,
        productShop,
        category,
        length:cartLength,
        
        
        
      
        id: userSession.userId,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1
      })
    }
  } catch (error) {
    console.log(error.message)
  }
}





module.exports = {
  loadLanding,
  loadLogin,
  loadRegister,
  userLogout,
  insertUser,
  loadHome,
  
  verifyLogin,
  loadShop,
  
  addToCart,
  deleteCart,
  loadCart,
  singleProduct,
  loadWishlist,
  addToWishlist,
  addCartdelWishlist,
  deleteWishlist,
  loadCheckout,
  addAddress,
  deleteAddress,
  sendMessage,
  loadOtp,
  verifyOtp,
  userDashboard,
  cancelOrder,
  viewOrder,
  storeOrder,
  returnProduct,
  razorpayCheckout,
  loadSuccess,
  getCategoryProduct,
  currentBanner,
  // editQuantity,
  changeProductQnty,
  userForgotPassword,
  changepassword,
  checkUser,
  sentOtp,
  addCoupon,
  editUser

};
