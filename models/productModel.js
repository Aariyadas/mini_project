
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description:{
    type:String,
    
  },
  
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  
  rating: {
    type: Number,
    required: true,
  },
  image: {
    type: Array,
  },
  category:{
    type:String,
    required:true
  },
  is_available: {
    type: Number,
    default: 1,
  }
})

module.exports = mongoose.model('Product', productSchema)
