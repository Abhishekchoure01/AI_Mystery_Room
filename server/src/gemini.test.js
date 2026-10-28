import {afterEach,describe,it,expect,vi} from 'vitest';
import {createMystery} from './services/gemini.js';
import {demoMystery} from './data/demoMystery.js';

const request={scenario:'A historic lens disappears during a storm while four visitors offer conflicting alibis.',difficulty:'medium',category:'theft'};
function modelOutput(){const {caseReference,status,isDemo,scenarioPrompt,createdAt,updatedAt,...output}=structuredClone(demoMystery);return output}
const response=value=>({output_text:typeof value==='string'?value:JSON.stringify(value)});
afterEach(()=>vi.unstubAllEnvs());

describe('Gemini generation service',()=>{
 it('accepts a valid structured case and adds private server metadata',async()=>{
  vi.stubEnv('GEMINI_API_KEY','test-key');
  const client={interactions:{create:vi.fn().mockResolvedValue(response(modelOutput()))}};
  const mystery=await createMystery(request,{client});
  expect(client.interactions.create).toHaveBeenCalledOnce();expect(mystery.status).toBe('ready');expect(mystery.isDemo).toBe(false);expect(mystery.scenarioPrompt).toBe(request.scenario);expect(mystery.solution.culpritSuspectId).toBe('ellis');
 });
 it('retries invalid structured output once with bounded correction',async()=>{
  vi.stubEnv('GEMINI_API_KEY','test-key');
  const client={interactions:{create:vi.fn().mockResolvedValueOnce(response('{invalid')).mockResolvedValueOnce(response(modelOutput()))}};
  await createMystery(request,{client});expect(client.interactions.create).toHaveBeenCalledTimes(2);
 });
 it('returns a controlled error after two invalid responses',async()=>{
  vi.stubEnv('GEMINI_API_KEY','test-key');
  const client={interactions:{create:vi.fn().mockResolvedValue(response('{}'))}};
  await expect(createMystery(request,{client})).rejects.toMatchObject({status:502,code:'MYSTERY_GENERATION_FAILED'});expect(client.interactions.create).toHaveBeenCalledTimes(2);
 });
 it('fails clearly when Gemini credentials are missing',async()=>{
  vi.stubEnv('GEMINI_API_KEY','');
  await expect(createMystery(request)).rejects.toMatchObject({status:503,code:'GEMINI_NOT_CONFIGURED'});
 });
 it('maps an unavailable configured Gemini model to a safe setup error',async()=>{
  vi.stubEnv('GEMINI_API_KEY','test-key');
  const client={interactions:{create:vi.fn().mockRejectedValue(Object.assign(new Error('provider details'),{status:404}))}};
  await expect(createMystery(request,{client})).rejects.toMatchObject({status:503,code:'GEMINI_MODEL_UNAVAILABLE',message:'The configured Gemini model is unavailable. Check GEMINI_MODEL.'});
 });
});
