import {describe,it,expect} from 'vitest';
import request from 'supertest';
import {app} from './app.js';

describe('API request validation',()=>{
 it('reports database readiness without leaking configuration',async()=>{const response=await request(app).get('/api/v1/health');expect(response.status).toBe(503);expect(response.body).toHaveProperty('status','degraded');expect(response.body).toHaveProperty('database','disconnected');expect(response.body).not.toHaveProperty('credentials')});
 it('returns a controlled error for an invalid scenario without calling Gemini',async()=>{const response=await request(app).post('/api/v1/mysteries').set('x-session-id','test-session-id-1234567890').send({scenario:'short'});expect(response.status).toBe(400);expect(response.body.error.code).toBe('VALIDATION_ERROR');expect(response.body.error.requestId).toBeTruthy()});
});
