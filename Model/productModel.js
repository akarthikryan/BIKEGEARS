const mongoose = require('mongoose')


const productSchema = mongoose.Schema({
    name : {
        type :String,
        required : true
    },
    image :{
        type : String,
        require : true   
    },
    images : {
        type : Array,
        require : true
    },
    rate : {
        type : Number,
        required : true
    },
    quantity : {
        type : Number,
        required : true 
    },
    unit : {
        type : Number,
        required :true
    },
    status : {
        type : Boolean,
        default : true ,
    },
    category : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    }


})

const ProductModel = mongoose.model('product',productSchema)
module.exports = ProductModel