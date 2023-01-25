const User = require("../models/userModel");
const Product = require('../models/productModel')
const bcrypt = require('bcrypt');
const path = require('path')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const multer = require('multer')
const Banner = require('../models/bannerModel');
const Coupon = require("../models/couponModel");
const objectId = require("mongodb").ObjectId;
const excelJs = require("exceljs");


const { ObjectId } = require("mongodb");


let Storage = multer.diskStorage({
    destination: "./public/assets/upload",
    filename: (req, file, cb) => {
        cb(null, "_" + Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({
    storage: Storage
}).single('image')

let orderType = 'all'

const loadLogin = async (req, res) => {
    try {
        res.render('login');

    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {


                if (userData.is_admin == 0) {
                    res.render('login', { message: "Email and password is incorrect" })

                }
                else {
                    adminSession = req.session
                    isAdminLoggedin = true
                    adminSession.adminId = userData._id
                    console.log("adminhme")
                    res.redirect("/admin/home")
                }
            }
            else {
                res.render('login', { message: "Password is incorrect" });
            }
        }
        else {
            res.render('login', { message: "Email is incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }
}



const loadDashboard = async (req, res) => {
    try {
      console.log("admin");
      adminSession = req.session;
      if (isAdminLoggedin) {
        const productData = await Product.find();
        const userData = await User.find({ is_admin: 0 });
        const categoryData = await Category.find();
  
        const categoryArray = [];
        const orderCount = [];
        for (let key of categoryData) {
          categoryArray.push(key.name);
          orderCount.push(0);
        }
        const completeOrder = [];
        const orderData = await Order.find();
        const orderItems = orderData.map((item) => item.products.item);
        let productIds = [];
        orderItems.forEach((orderItem) => {
          orderItem.forEach((item) => {
            productIds.push(item.productId.toString());
          });
        });
  
        const s = [...new Set(productIds)];
        const uniqueProductObjs = s.map((id) => {
          return { id: ObjectId(id), qty: 0 };
        });
        orderItems.forEach((orderItem) => {
          orderItem.forEach((item) => {
            uniqueProductObjs.forEach((idObj) => {
              if (item.productId.toString() === idObj.id.toString()) {
                idObj.qty += item.qty;
              }
            });
          });
        });
  
        for (let key of orderData) {
          const append = await key.populate("products.item.productId");
          completeOrder.push(append);
        }
  
        completeOrder.forEach((order) => {
          order.products.item.forEach((it) => {
            uniqueProductObjs.forEach((obj) => {
              if (it.productId._id.toString() === obj.id.toString()) {
                uniqueProductObjs.forEach((ss) => {
                  if (ss.id.toString() !== it.productId._id.toString()) {
                    obj.name = it.productId.name;
                  }
                });
              }
            });
          });
        });
        const salesCount = [];
        const productName = productData.map((product) => product.name);
        for (let i = 0; i < productName.length; i++) {
          for (let j = 0; j < uniqueProductObjs.length; j++) {
            if (productName[i] === uniqueProductObjs[j].name) {
              salesCount.push(uniqueProductObjs[j].qty);
            } else {
              salesCount.push(0);
            }
          }
        }
  
        console.log(salesCount);
        console.log(productName);
        for (let i = 0; i < completeOrder.length; i++) {
          for (let j = 0; j < completeOrder[i].products.item.length; j++) {
            const categoryData = completeOrder[i].products.item[j].productId.category;
            const isExisting = categoryArray.findIndex((category) => {
              return category === categoryData;
            });
            orderCount[isExisting]++;
            console.log(categoryData);
            console.log(orderCount);
          }
        }
  
        if (productName && salesCount) {
          res.render("home", {
            products: productData,
            users: userData,
            category: categoryArray,
            count: orderCount,
            pname: productName,
            pcount: salesCount,
          });
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };
const isLogout = async (req, res) => {
    try {
        const adminSession = req.session
        adminSession.adminId = false
        res.redirect('/admin/login');

    } catch (error) {

        console.log(error.message);
    }
}

const userList = async (req, res) => {
    console.log('adminuserlist')
    try {
        const adminSession = req.session
        adminSession.adminId
        const userData = await User.find({ is_admin: 0 });
        res.render("adminuser", { users: userData });
    } catch (error) {

        console.log(error.message);
    }
}

const blockUser = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await User.findById({ _id: id })
        if (userData.is_verified) {
            await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 0 } })
        }
        else {
            await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 1 } })
        }
        res.redirect('/admin/userlist')
    } catch (error) {
        console.log(error.message);
    }
}

const viewProduct = async (req, res) => {
    console.log('view products')
    try {
        const adminSession = req.session
        adminSession.adminId
        const productData = await Product.find({})

        res.render('adminProduct', { products: productData })
    } catch (error) {
        console.log(error)
    }

}
const addProductLoad = async (req, res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        console.log("add product loaded")
        const categoryData = await Category.find()
        console.log("Add")
        res.render('addProduct', { category: categoryData })
    } catch (error) {
        console.log(error)
    }

}


const editProduct = async (req, res) => {
    try {

      adminSession = req.session
      if (adminSession.adminId){
        const productId = req.query.id
        console.log(productId)
        const productData = await Product.findById({ _id: productId })
        const categoryData = await Category.find()
        console.log('product Data : ' + productData)
        if (productData) {
            res.render('editProduct', { product: productData, category: categoryData })
        }
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
        console.log(error.message);
    }
}




const updateAddProduct = async (req, res) => {
    try {

        const files = req.files

        const product = Product({

            name: req.body.name,
            price: req.body.price,
            quantity: req.body.quantity,
            category: req.body.category,
            description: req.body.description,
            rating: req.body.rating,
            image: files.map((x) => x.filename)
        })
        const categoryData = await Category.find()
        const productData = await product.save()





        if (productData) {
            res.render('addProduct', { message: "Your registration was successfull.", product: productData, category: categoryData })
        } else {
            res.render('addProduct', { message: "Your registration was a failure" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateEditProduct = async (req, res) => {
    try {
        adminSession = req.session
        const productId = req.params.id
        if (adminSession.adminId) {
             const files = req.files
            const productData = await Product.findByIdAndUpdate({ _id: productId },
                {
                    name: req.body.name,
                    price: req.body.price,
                    quantity: req.body.quantity,
                    category: req.body.category,
                    description: req.body.description,
                    rating: req.body.rating,
                    rating: req.body.rating,
                    image: files.map((x) => x.filename)

                }
            )
            
            if (productData) {
                res.redirect('/admin/viewProduct')
            }
        }
        else {
            res.redirect('/admin/login')
        }
        console.log(id)

    } catch (error) {
        console.log(error.message)
    }
}




const blockProduct = async (req, res) => {
    try {
        const productData = await Product.findOneAndUpdate({ _id: req.query.id }, { $set: { is_available: 1 } })
        if (productData) {
            console.log('block working')
            console.log(productData)
            res.redirect('/admin/adminProduct')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const showProduct = async (req, res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        const productData = await Product.findOneAndUpdate({ _id: req.query.id }, { $set: { is_available: 0 } })
        if (productData) {
            console.log('show working')
            console.log(productData)
            res.redirect('/admin/adminProduct')
        }
    } catch (error) {
        console.log(error.message)
    }
}
const viewCategory = async (req, res) => {
  console.log('view category')
    const adminSession = req.session
    adminSession.adminId
    const categoryData = await Category.find()
    res.render('adminCategory', { category: categoryData })
}

const addCategory = async (req, res) => {
    const categoryData = await Category.findOne({ name: req.body.category })
    if (categoryData) {
        res.render('adminCategory', { category: categoryData, message: 'Category already Exists' })
    } else {
        try {
            const category = Category({
                name: req.body.category
            })
            const categoryData = await category.save()
            res.redirect('/admin/adminCategory')
        } catch (error) {

        }
    }
}



const showCategory = async (req, res) => {
  console.log('show')
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      console.log('giiiiii')
      console.log(req.query.id)
      const categoryData = await Category.findByIdAndUpdate({ _id: req.query.id }, { $set: { isAvaiable: 1 } })
      console.log(categoryData)
      if (categoryData) {
        res.redirect('/admin/adminCategory')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const blockCategory = async (req, res) => {
  console.log('show category')
  try {
    console.log('try show')
    adminSession = req.session
    if (adminSession.adminId) {
      console.log('show admin Session')
      const categoryData = await Category.findByIdAndUpdate({ _id: req.query.id }, { $set: { isAvaiable: 0 } })
      if (categoryData) {
        console.log('show category data')
        res.redirect('/admin/adminCategory')
      }
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log('show catch')
    console.log(error.message)
  }
}
const editCategory = async (req, res) => {
    try {
      adminSession = req.session
      if (adminSession.adminId) {
        const id = req.query.id
        const categoryData = await Category.findById({ _id: id })
        res.render('editcategory', { category: categoryData })
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }
  
  const updateCategory = async (req, res) => {
    try {
      adminSession = req.session
      if (adminSession.adminId) {
        const id = req.params.id
        console.log(id)
        const categoryData = await Category.findByIdAndUpdate({ _id: id }, { name: req.body.category })
        console.log(categoryData)
        if (categoryData) {
          res.redirect('/admin/adminCategory')
        }
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }
  
  


// const viewOrder = async (req, res) => {
//     try {
//         const orderData = await Order.find().sort({createdAt:-1})

//         if (orderType == undefined) {
//             res.render('adminOrder', { order: orderData })
//         } else {
//             id = req.query.id
//             res.render('adminOrder', { id: id, order: orderData })
//         }
//     } catch (error) {
//         console.log(error)
//     }
// };

const viewOrder = async(req,res)=>{
  try {
    const productData = await Product.find()
    const userData = await User.find({is_admin: 0})
    const orderData = await Order.find().sort({createdAt :-1})
    console.log(orderData)
    for(let key of orderData){
      await key.populate('products.item.productId');
      await key.populate('userId');
    }
    if (orderType == undefined) {
      res.render('adminOrder', {
        users: userData,
        product: productData,
        order: orderData,
        
      });
    }else{
        id = req.query.id;
        res.render('adminOrder', {
          users: userData,
          product: productData,
          order: orderData,
          id: id,
        });
    }
  } catch (error) {
    console.log(error.message)
  }
}
const updateOrderStatus = async (req, res) => {
    try {
        // const status=req.body.status
        console.log(req.body);
        let orderId = req.body.orderid;
        const a = await Order.findByIdAndUpdate({ _id: objectId(orderId) }, { $set: { status: req.body.status } })
        res.redirect("/admin/adminOrder")
    } catch (error) {
        console.log(error.messaage);
    }
}

// const adminOrderDetails = async(req,res)=>{
//   try {
//       const id = req.query.id
//       const orderData = await Orders.findById({_id:id});
//       await orderData.populate('products.item.productId');
//       await orderData.populate('userId')
//  res.render('adminOrder',{
//   order:orderData,

//  })
//   } catch (error) {
//     console.log(error.message);
//   }
// }


const getBanners = async (req, res) => {
    try {
        const bannerData = await Banner.find()
        console.log(bannerData);
        res.render('banner', {
            banners: bannerData
        })

    } catch (error) {
        console.log(error.message)
    }
}


const addBanner = async (req, res) => {
    try {
        const newBanner = req.body.banner
        console.log(newBanner);
        const a = req.files
        console.log(req.files)
        const banner = new Banner({
            banner: newBanner,
            bannerImage: a.map((x) => x.filename)
        })
        const bannerData = await banner.save()

        if (bannerData) {
            res.redirect('/admin/loadBanners')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const currentBanner = async (req, res) => {
    try {

        const id = req.query.id

        await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } })
        await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } })
        res.redirect('/admin/loadBanners')
    } catch (error) {
        console.log(error.message)
    }
}



const adminLoadOffer = async(req,res) =>{
    try {
        const offerData = await Coupon.find()
        res.render('coupon',{offer:offerData})
    } catch (error) {
        console.log("error.message")
    }
}
const adminAddOffer = async (req,res) => {
    try {
        const offer = Coupon({
            name:req.body.name,
            type:req.body.type,
            discount:req.body.discount
        })
        await offer.save()
        res.redirect("/admin/admin-offer")
    } catch (error) {
        console.log(error.message)
    }
}

const loadCoupon = async (req, res) => {
    try {
      adminSession = req.session
      if (adminSession.adminId) {
        const offerData = await Coupon.find({})
        console.log(offerData)
        res.render('couponlist', { coupon: offerData })
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }
  const blockCoupon = async (req, res) => {
    try {
      adminSession = req.session
      if (adminSession.adminId) {
        const Id = req.query.id
        const couponData = await Coupon.findByIdAndUpdate({ _id: Id }, { $set: { isActive: 0 } })
        if (couponData) {
          res.redirect('/admin/couponlist')
        } else {
          res.redirect('/admin/couponlist')
        }
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }
  const showCoupon = async (req, res) => {
    try {
      adminSession = req.session
      if (adminSession.adminId) {
        const Id = req.query.id
        const couponData = await Coupon.findByIdAndUpdate({ _id: Id }, { $set: { isActive: 1 } })
        if (couponData) {
          res.redirect('/admin/couponlist')
        } else {
          res.redirect('/admin/couponlist')
        }
      } else {
        res.redirect('/admin/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }




function changedateformat(val) {
    const myArray = val.split("-");

    const year = myArray[0];
    const month = myArray[1];
    const day = myArray[2];

    const formatteddate = day + "/" + month + "/" + year;
    return formatteddate;
}
const orderDownload = async function(req,res){
    try {
      const workBook = new excelJs.Workbook();
      const workSheet = workBook.addWorksheet("My users");
      workSheet.columns=[
        {header:"S no.",key:"s_no"},
      {header:"UserId",key:"userId"},
      {header:"Amount",key:"products.totalPrice"},
      {header:"Payment",key:"payment"},
      {header:"Country",key:"country"},
      {header:"Address",key:"address"},
      {header:"State",key:"state"},
      {header:"City",key:"city"},
      {header:"Zip",key:"zip"},
      {header:"Date",key:"createdAt"},
      {header:"Status",key:"status"},
    
      ]
  
      let counter =1;
  
      const orderData = await Order.find({});
  
      orderData.forEach(function(orders){
        orders.s_no = counter;
        workSheet.addRow(orders);
        counter++;
      })
  
      workSheet.getRow(1).eachCell(function(cell){
        cell.font = {bold:true};
      })
  
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
  
      res.setHeader(
        "Content-Disposition",`attachment;filename=orders.xlsx`
      )
      
      return workBook.xlsx.write(res).then(function(){
        res.status(200);
      })
    } catch (error) {
      console.log(error.message)
    }
  }




module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    isLogout,
    userList,
    blockUser,
    viewProduct,
    updateAddProduct,
    upload,
    addProductLoad,
    editProduct,
    updateEditProduct,
    blockProduct,
    viewCategory,
    addCategory,
    showCategory,
    blockCategory,
    editCategory,
    updateCategory,
   
    showProduct,
    viewOrder,
    
    orderDownload,
    getBanners,
    addBanner,
    currentBanner,
    updateOrderStatus,
    changedateformat,
    adminAddOffer,
    adminLoadOffer,
    loadCoupon,
    blockCoupon,
    showCoupon

    // deactivateCoupen
}

