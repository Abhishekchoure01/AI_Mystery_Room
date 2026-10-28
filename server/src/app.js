import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit,{ipKeyGenerator} from 'express-rate-limit';
import {randomUUID} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generationRequestSchema,accusationRequestSchema,toPublicMystery} from '@mystery/shared';
import {Mystery} from './models/Mystery.js';
import {Attempt} from './models/Attempt.js';
import {createMystery} from './services/gemini.js';
import {errorHandler,requestId,startLatency} from './middleware.js';
import {demoMystery} from './data/demoMystery.js';

export const app=express();
app.disable('x-powered-by');app.use(helmet());
if(process.env.NODE_ENV==='production')app.set('trust proxy',1);
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173',credentials:true}));
app.use(express.json({limit:'24kb'}));app.use(requestId,startLatency);
const rateWindow=Number(process.env.RATE_LIMIT_WINDOW_MS||3600000);
const limited=(limit,keyGenerator)=>rateLimit({windowMs:rateWindow,limit,standardHeaders:'draft-8',legacyHeaders:false,keyGenerator,handler:(req,res)=>res.status(429).json({error:{code:'RATE_LIMITED',message:'You have reached the case generation limit. Please try again later.',requestId:req.id}})});
const globalGenerateLimit=limited(30,req=>ipKeyGenerator(req.ip));
const sessionGenerateLimit=limited(Number(process.env.SESSION_GENERATION_LIMIT||5),req=>{const session=req.get('x-session-id');return session?`session:${session}`:ipKeyGenerator(req.ip)});

app.get('/api/v1/health',(_req,res)=>{const connected=Boolean(globalThis.mongoReady&&Mystery.db.readyState===1);res.status(connected?200:503).json({status:connected?'ok':'degraded',database:connected?'connected':'disconnected'})});
app.get('/api/v1/demo',async(_req,res,next)=>{try{let doc=await Mystery.findOne({mysteryId:'demo-case'});if(!doc){doc=await Mystery.findOneAndUpdate({mysteryId:'demo-case'},{$setOnInsert:{mysteryId:'demo-case',caseReference:demoMystery.caseReference,data:demoMystery,createdAt:new Date(demoMystery.createdAt)}},{upsert:true,new:true});}res.json({mystery:{id:'demo-case',...toPublicMystery(doc.data)}})}catch(e){next(e)}});
app.post('/api/v1/mysteries',globalGenerateLimit,sessionGenerateLimit,async(req,res,next)=>{
 try{const parsed=generationRequestSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Please enter a scenario between 30 and 2,000 characters and choose valid settings.',requestId:req.id}});const mystery=await createMystery(parsed.data);const mysteryId=randomUUID();await Mystery.create({mysteryId,caseReference:mystery.caseReference,data:mystery,createdAt:new Date(mystery.createdAt)});res.status(201).json({mystery:{id:mysteryId,...toPublicMystery(mystery)}})}catch(e){next(e)}
});
app.get('/api/v1/mysteries/:id',async(req,res,next)=>{try{const doc=await Mystery.findOne({mysteryId:req.params.id});if(!doc)return res.status(404).json({error:{code:'MYSTERY_NOT_FOUND',message:'This case could not be found.',requestId:req.id}});res.json({mystery:{id:doc.mysteryId,...toPublicMystery(doc.data)}})}catch(e){next(e)}});
app.post('/api/v1/mysteries/:id/accusations',async(req,res,next)=>{
 try{
  const parsed=accusationRequestSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Select one suspect and keep your optional reasoning under 1,000 characters.',requestId:req.id}});
  const {sessionId,selectedSuspectId,reasoning}=parsed.data,doc=await Mystery.findOne({mysteryId:req.params.id});
  if(!doc)return res.status(404).json({error:{code:'MYSTERY_NOT_FOUND',message:'This case could not be found.',requestId:req.id}});
  if(!doc.data.suspects.some(s=>s.id===selectedSuspectId))return res.status(400).json({error:{code:'INVALID_SUSPECT',message:'Select a suspect listed in this case.',requestId:req.id}});
  const prior=await Attempt.findOne({mysteryId:req.params.id,sessionId});if(prior)return res.status(409).json({error:{code:'ATTEMPT_ALREADY_SUBMITTED',message:'An accusation has already been submitted for this case.',requestId:req.id}});
  const isCorrect=selectedSuspectId===doc.data.solution.culpritSuspectId,attempt=await Attempt.create({mysteryId:req.params.id,sessionId,selectedSuspectId,userReasoning:reasoning,isCorrect});
  const culprit=doc.data.suspects.find(s=>s.id===doc.data.solution.culpritSuspectId);
  res.json({result:{attemptId:String(attempt._id),isCorrect,selectedSuspectId,culprit:{id:culprit.id,name:culprit.name},solution:doc.data.solution,scenarioAnalysis:doc.data.scenarioAnalysis}});
 }catch(e){if(e.code===11000)return res.status(409).json({error:{code:'ATTEMPT_ALREADY_SUBMITTED',message:'An accusation has already been submitted for this case.',requestId:req.id}});next(e)}
});
app.get('/api/v1/mysteries/:id/result',async(req,res,next)=>{try{const sessionId=req.query.sessionId;if(typeof sessionId!=='string')return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'A session ID is required.',requestId:req.id}});const attempt=await Attempt.findOne({mysteryId:req.params.id,sessionId});if(!attempt)return res.status(404).json({error:{code:'RESULT_NOT_FOUND',message:'No completed result was found for this session.',requestId:req.id}});const doc=await Mystery.findOne({mysteryId:req.params.id});if(!doc)return res.status(404).json({error:{code:'MYSTERY_NOT_FOUND',message:'This case could not be found.',requestId:req.id}});const culprit=doc.data.suspects.find(s=>s.id===doc.data.solution.culpritSuspectId);res.json({result:{attemptId:String(attempt._id),isCorrect:attempt.isCorrect,selectedSuspectId:attempt.selectedSuspectId,culprit:{id:culprit.id,name:culprit.name},solution:doc.data.solution,scenarioAnalysis:doc.data.scenarioAnalysis}})}catch(e){next(e)}});
if(process.env.NODE_ENV==='production'){
 const clientDist=resolve(dirname(fileURLToPath(import.meta.url)),'../../client/dist');
 app.use(express.static(clientDist));
 app.use((req,res,next)=>{if(req.method!=='GET'||req.path.startsWith('/api'))return next();res.sendFile(resolve(clientDist,'index.html'),error=>{if(error)next(error)})});
}
app.use(errorHandler);
