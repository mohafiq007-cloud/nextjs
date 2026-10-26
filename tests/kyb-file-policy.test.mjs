import test from 'node:test';import assert from 'node:assert/strict';
import {evidenceMime,MAX_KYB_BYTES} from '../lib/mariz/kyb-file-policy.mjs';
test('KYB uses actual file signatures instead of attacker MIME or filename',()=>{
 assert.equal(evidenceMime(Buffer.from('%PDF-1.4\nSynthetic fixture\n')),'application/pdf');
 assert.equal(evidenceMime(Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(16)])),'image/png');
 assert.equal(evidenceMime(Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(16)])),'image/jpeg');
 for(const data of ['<svg onload="alert(1)">','<html>private</html>','PK compressed archive'])assert.throws(()=>evidenceMime(Buffer.from(data)));
});
test('KYB refuses tiny and oversized evidence',()=>{assert.throws(()=>evidenceMime(new Uint8Array(15)));assert.throws(()=>evidenceMime(new Uint8Array(MAX_KYB_BYTES+1)));});
