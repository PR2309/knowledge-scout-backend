const mongoose =require("mongoose");

const DocSchema=new mongoose.Schema({
    title:{type:String,required:true},
    content:{type:String},
    filename:{type:String,required:true},
    owner:{type:String, required:true},
    private: { type: Boolean, default: false },
    shareToken: { type: String, default: null },
    createdAt:{type:Date,default:Date.now},
});
module.exports = mongoose.model("Doc", DocSchema); // <-- export the model
