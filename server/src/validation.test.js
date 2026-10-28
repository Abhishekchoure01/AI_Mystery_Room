import {describe,it,expect} from 'vitest';
import {demoMystery} from './data/demoMystery.js';
import {validateMysteryIntegrity,toPublicMystery,generationRequestSchema,accusationRequestSchema} from '@mystery/shared';

describe('mystery contract',()=>{
 it('accepts the playable demo and checks cross references',()=>{expect(validateMysteryIntegrity(demoMystery).success).toBe(true)});
 it('rejects a duplicate culprit reference or malformed evidence reference',()=>{const invalid=structuredClone(demoMystery);invalid.solution.culpritSuspectId='unknown';expect(validateMysteryIntegrity(invalid).success).toBe(false)});
 it('strips solution, scenario analysis, red herring flags, and reliability from the public DTO',()=>{const dto=toPublicMystery(demoMystery);expect(dto).not.toHaveProperty('solution');expect(dto).not.toHaveProperty('scenarioAnalysis');expect(dto.evidence[0]).not.toHaveProperty('isRedHerring');expect(dto.evidence[0]).not.toHaveProperty('reliability')});
 it('enforces scenario bounds and supported difficulty/category values',()=>{expect(generationRequestSchema.safeParse({scenario:'too short',difficulty:'medium'}).success).toBe(false);expect(generationRequestSchema.safeParse({scenario:'A fictional case premise long enough to meet the minimum scenario length.',difficulty:'medium',category:'general'}).success).toBe(true)});
 it('caps optional accusation reasoning at 1,000 characters',()=>{expect(accusationRequestSchema.safeParse({sessionId:'a'.repeat(30),selectedSuspectId:'mara',reasoning:'x'.repeat(1001)}).success).toBe(false)});
});
