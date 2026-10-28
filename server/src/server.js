import {config} from 'dotenv';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
config({path:resolve(dirname(fileURLToPath(import.meta.url)),'../../.env')});
const {app}=await import('./app.js');

const port=Number(process.env.PORT||5000),timeout=Number(process.env.GENERATION_TIMEOUT_MS||90000),attempts=Number(process.env.MAX_GENERATION_ATTEMPTS||2),ttlDays=Number(process.env.MYSTERY_TTL_DAYS||30),rateWindow=Number(process.env.RATE_LIMIT_WINDOW_MS||3600000),generationLimit=Number(process.env.SESSION_GENERATION_LIMIT||5);
const invalid=[];if(!process.env.MONGODB_URI)invalid.push('MONGODB_URI');if(!Number.isInteger(port)||port<1||port>65535)invalid.push('PORT');if(!Number.isFinite(timeout)||timeout<1000)invalid.push('GENERATION_TIMEOUT_MS');if(!Number.isInteger(attempts)||attempts<1||attempts>2)invalid.push('MAX_GENERATION_ATTEMPTS (1-2)');if(!Number.isInteger(ttlDays)||ttlDays<1)invalid.push('MYSTERY_TTL_DAYS');if(!Number.isInteger(rateWindow)||rateWindow<1000)invalid.push('RATE_LIMIT_WINDOW_MS');if(!Number.isInteger(generationLimit)||generationLimit<1)invalid.push('SESSION_GENERATION_LIMIT');
if(invalid.length){console.error(`Invalid or missing server configuration: ${invalid.join(', ')}`);process.exit(1)}
try{await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});globalThis.mongoReady=true;await mongoose.connection.collection('mysteries').createIndex({createdAt:1},{expireAfterSeconds:ttlDays*86400});await mongoose.connection.collection('attempts').createIndex({mysteryId:1,sessionId:1},{unique:true});await mongoose.connection.collection('attempts').createIndex({submittedAt:1},{expireAfterSeconds:ttlDays*86400});app.listen(port,()=>console.log(`AI Mystery Room API listening on port ${port}`))}catch(error){console.error(`MongoDB connection failed (${error.name})`);process.exit(1)}
