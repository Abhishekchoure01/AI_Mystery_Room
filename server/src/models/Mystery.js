import mongoose from 'mongoose';
const mysterySchema=new mongoose.Schema({mysteryId:{type:String,required:true,unique:true,index:true},caseReference:{type:String,required:true,unique:true,index:true},data:{type:mongoose.Schema.Types.Mixed,required:true},createdAt:{type:Date,required:true}},{versionKey:false});
export const Mystery=mongoose.model('Mystery',mysterySchema);
