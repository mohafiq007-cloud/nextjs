export const MAX_KYB_BYTES=4*1024*1024;
export function evidenceMime(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<16||bytes.length>MAX_KYB_BYTES)throw Error('Evidence must be 16 bytes to 4 MB');
 if(Buffer.from(bytes.subarray(0,5)).toString()==='%PDF-')return 'application/pdf';
 if(Buffer.from(bytes.subarray(0,8)).toString('hex')==='89504e470d0a1a0a')return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 throw Error('Upload a PDF, PNG or JPEG');
}
