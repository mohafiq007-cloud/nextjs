import 'server-only';
import {S3Client,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {createHash} from 'node:crypto';
import {MAX_KYB_BYTES,evidenceMime} from './kyb-file-policy.mjs';
export {MAX_KYB_BYTES,evidenceMime} from './kyb-file-policy.mjs';
const endpoints=new Set(['https://br-jolly-frost-aoz9yzhn.storage.c-2.ap-southeast-1.aws.neon.tech','https://br-bold-unit-aothxcnn.storage.c-2.ap-southeast-1.aws.neon.tech']);
export function kybStorageConfigured(){return endpoints.has(process.env.AWS_ENDPOINT_URL_S3||'')&&Boolean(process.env.AWS_ACCESS_KEY_ID&&process.env.AWS_SECRET_ACCESS_KEY)&&process.env.MARIZ_KYB_UPLOADS_ENABLED==='true';}
function client(){if(!kybStorageConfigured())throw Error('Private evidence service unavailable');return new S3Client({endpoint:process.env.AWS_ENDPOINT_URL_S3,region:'ap-southeast-1',forcePathStyle:true,credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID!,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY!}});}
export async function storeEvidence(key:string,bytes:Uint8Array){
 const mime=evidenceMime(bytes),sha=createHash('sha256').update(bytes).digest('hex');
 await client().send(new PutObjectCommand({Bucket:'mariz-kyb-private',Key:key,Body:bytes,ContentType:mime,CacheControl:'no-store'}));
 return {mime,sha};
}
export type EvidenceDescriptor={id:string;storage_key:string;mime_type:string;size_bytes:number;sha256_hex:string};
export async function readEvidence(meta:EvidenceDescriptor){
 if(!Number.isInteger(meta.size_bytes)||meta.size_bytes<16||meta.size_bytes>MAX_KYB_BYTES||!/^([a-f0-9-]{36}\/){2}[a-f0-9-]{36}$/.test(meta.storage_key))throw Error('Evidence unavailable');
 const result=await client().send(new GetObjectCommand({Bucket:'mariz-kyb-private',Key:meta.storage_key}));
 if(result.ContentLength!==meta.size_bytes||!result.Body)throw Error('Evidence integrity check failed');
 const bytes=await result.Body.transformToByteArray();
 if(bytes.length!==meta.size_bytes||createHash('sha256').update(bytes).digest('hex')!==meta.sha256_hex||evidenceMime(bytes)!==meta.mime_type)throw Error('Evidence integrity check failed');
 return bytes;
}
