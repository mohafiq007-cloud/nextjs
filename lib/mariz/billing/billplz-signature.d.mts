/** Billplz X Signature helper declarations for the .mjs runtime module. */
export declare function billplzSignaturePayload(fields: Record<string,string>): string;
export declare function billplzSignatureHex(fields: Record<string,string>,secret: string): string;
export declare function verifyBillplzSignature(fields: Record<string,string>,secret: string): boolean;
