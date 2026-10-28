import { z } from 'zod';

export const difficultySchema = z.enum(['easy','medium','hard']);
export const categorySchema = z.enum(['murder','theft','disappearance','sabotage','general']);
export const evidenceTypeSchema = z.enum(['message','photo','camera_log','witness_statement','document','timeline']);

export const generationRequestSchema = z.object({
  scenario:z.string().trim().min(30).max(2000),
  difficulty:difficultySchema.default('medium'),
  category:categorySchema.default('general')
}).strict();

export const mysterySchema = z.object({
  title:z.string().min(3).max(100),
  caseReference:z.string().min(4).max(20),
  category:categorySchema,
  difficulty:difficultySchema,
  setting:z.object({location:z.string().min(2),dateDescription:z.string().min(2),incidentDescription:z.string().min(10)}),
  caseBrief:z.string().min(30).max(1200),
  objective:z.string().min(10).max(250),
  suspects:z.array(z.object({id:z.string().min(1),name:z.string().min(2),role:z.string().min(2),description:z.string().min(10),motive:z.string().min(8),alibi:z.string().min(8),portraitDescription:z.string().optional()})).min(3).max(5),
  evidence:z.array(z.object({id:z.string().min(1),number:z.number().int().positive(),type:evidenceTypeSchema,title:z.string().min(3),source:z.string().min(2),timestamp:z.string().optional(),summary:z.string().min(8),content:z.string().min(10),relatedSuspectIds:z.array(z.string()),reliability:z.enum(['high','medium','low']),isRedHerring:z.boolean(),simulatedLabel:z.enum(['SIMULATED'])})).min(5).max(8),
  timeline:z.array(z.object({time:z.string(),event:z.string().min(5),relatedSuspectIds:z.array(z.string()),relatedEvidenceIds:z.array(z.string())})).min(4),
  solution:z.object({culpritSuspectId:z.string(),summary:z.string().min(20),fullExplanation:z.string().min(50),evidenceReasoning:z.array(z.object({evidenceId:z.string(),inference:z.string().min(10),supportsCulprit:z.boolean()})).min(3),misleadingClues:z.array(z.object({evidenceId:z.string(),explanation:z.string().min(10)}))}),
  status:z.literal('ready'),isDemo:z.boolean(),scenarioPrompt:z.string().min(30).max(2000),scenarioAnalysis:z.string().min(30).max(1000),
  createdAt:z.string(),updatedAt:z.string()
});

export const geminiMysterySchema=mysterySchema.omit({caseReference:true,status:true,isDemo:true,scenarioPrompt:true,createdAt:true,updatedAt:true});

export const accusationRequestSchema=z.object({sessionId:z.string().min(20).max(120),selectedSuspectId:z.string().min(1),reasoning:z.string().max(1000).optional()}).strict();

const {solution,scenarioAnalysis,...publicFields}=mysterySchema.shape;
export const publicMysterySchema=z.object(publicFields).strict();

export function validateMysteryIntegrity(mystery){
 const parsed=mysterySchema.safeParse(mystery);
 if(!parsed.success)return {success:false,issues:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`)};
 const m=parsed.data, suspectIds=m.suspects.map(s=>s.id), evidenceIds=m.evidence.map(e=>e.id);
 const exact={easy:[3,5],medium:[4,6],hard:[5,8]}[m.difficulty];
 const issues=[];
 if(m.suspects.length!==exact[0])issues.push(`${m.difficulty} difficulty requires exactly ${exact[0]} suspects`);
 if(m.evidence.length<exact[1]||m.evidence.length>(m.difficulty==='medium'?7:exact[1]))issues.push(`${m.difficulty} difficulty requires ${m.difficulty==='medium'?'6–7':exact[1]} evidence items`);
 if(new Set(suspectIds).size!==suspectIds.length)issues.push('Suspect IDs must be unique');
 if(new Set(evidenceIds).size!==evidenceIds.length)issues.push('Evidence IDs must be unique');
 if(new Set(m.evidence.map(e=>e.number)).size!==m.evidence.length)issues.push('Evidence numbers must be unique');
 if(!suspectIds.includes(m.solution.culpritSuspectId))issues.push('The culprit ID must reference a listed suspect');
 for(const e of m.evidence)for(const id of e.relatedSuspectIds)if(!suspectIds.includes(id))issues.push(`Evidence ${e.id} references an unknown suspect`);
 for(const t of m.timeline){for(const id of t.relatedSuspectIds)if(!suspectIds.includes(id))issues.push(`Timeline event references unknown suspect ${id}`);for(const id of t.relatedEvidenceIds)if(!evidenceIds.includes(id))issues.push(`Timeline event references unknown evidence ${id}`)}
 for(const r of [...m.solution.evidenceReasoning,...m.solution.misleadingClues])if(!evidenceIds.includes(r.evidenceId))issues.push(`Solution references unknown evidence ${r.evidenceId}`);
 const supports=m.solution.evidenceReasoning.filter(r=>r.supportsCulprit).length;
 if(supports<2)issues.push('At least two evidence items must support the culprit');
 if(m.evidence.some(e=>e.isRedHerring)&&m.solution.misleadingClues.length===0)issues.push('Red herrings need a solution explanation');
 if(issues.length)return {success:false,issues};
 return {success:true,data:m};
}

export function toPublicMystery(m){
 const {solution,scenarioAnalysis,scenarioPrompt,...publicCase}=m;
 publicCase.evidence=publicCase.evidence.map(({isRedHerring,reliability,...item})=>item);
 return publicCase;
}
