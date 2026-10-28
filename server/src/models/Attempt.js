import mongoose from 'mongoose';
const attemptSchema=new mongoose.Schema({mysteryId:{type:String,required:true,index:true},sessionId:{type:String,required:true},selectedSuspectId:{type:String,required:true},userReasoning:{type:String,maxlength:1000},isCorrect:{type:Boolean,required:true},submittedAt:{type:Date,default:Date.now}},{versionKey:false});
attemptSchema.index({mysteryId:1,sessionId:1},{unique:true});
export const Attempt=mongoose.model('Attempt',attemptSchema);
