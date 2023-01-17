const mongoose = require('mongoose')
const product = require('../models/productModel')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile:{
        type:Number,
        required:true
    },
    password: {
        type: String,
        required: true
    },
   


    is_admin: {
        type: Number,
        default: 0,

    },
    is_verified: {
        type: Number,
        default: 1

    },
    address: {
        Details: [
          {
            addId: {
              type: mongoose.Types.ObjectId,
              ref: 'Address'
            }
          }
        ]
      },


    cart: {
        item: [{
            productId: {
                type: mongoose.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            qty: {
                type: Number,
                required: true
            },
            price: {
                type: Number
            },
        }],
        totalPrice: {
            type: Number,
            default: 0
        }
    },


    wishlist: {
        item: [{
            productId: {
                type: mongoose.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            price: {
                type: Number
            },
        }]
    }
})
userSchema.methods.addToCart = async function (product) {
    try {
        
 
    const cart = this.cart
    const isExisting = cart.item.findIndex(objInItems => {
        return new String(objInItems.productId).trim() == new String(product._id).trim()
    })
    if (isExisting >= 0) {
        cart.item[isExisting].qty += 1
    } else {
        cart.item.push({
            productId: product._id,
            qty: 1, price: product.price
        })
    }
    cart.totalPrice += product.price
    console.log("User in schema:", this);
    return this.save()
} catch (error) {
    console.log(error.message);
}
}

userSchema.methods.removefromCart = async function (productId) {
    try {
    const cart = this.cart
    const isExisting = cart.item.findIndex(objInItems => new String(objInItems.productId).trim() === new String(productId).trim())
    if (isExisting >= 0) {
        const prod = await product.findById(productId)
        cart.totalPrice -= prod.price * cart.item[isExisting].qty
        cart.item.splice(isExisting, 1)
        console.log("User in schema:", this);
        return this.save()
    }
} catch (error) {
    console.log(error.message);
}
}

userSchema.methods.addToWishlist = async function (product) {
    try {
    const wishlist = this.wishlist
    const isExisting = wishlist.item.findIndex(objInItems => {
        return new String(objInItems.productId).trim() == new String(product._id).trim()
    })
    if (isExisting >= 0) {

    } else {
        wishlist.item.push({
            productId: product._id,
            price: product.price
        })
    }
    return this.save()
} catch (error) {
    console.log(error.message);
}
}
userSchema.methods.removefromWishlist = async function (productId) {
    try {
    const wishlist = this.wishlist
    const isExisting = wishlist.item.findIndex(objInItems => new String(objInItems.productId).trim() === new String(productId).trim())
    if (isExisting >= 0) {
        const prod = await product.findById(productId)
        wishlist.totalQty -=wishlist.item[isExisting].qty
        wishlist.item.splice(isExisting, 1)
        return this.save()
    }
} catch (error) {
    console.log(error.message);
}

}



module.exports = mongoose.model('User', userSchema)