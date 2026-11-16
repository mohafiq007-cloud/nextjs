import SecureStoreTerminal from "./terminal-client";
export const dynamic="force-dynamic";
export const metadata={title:"MARIZ POS — Store Terminal",robots:{index:false,follow:false}};
export default async function StoreTerminal({searchParams}:{
 searchParams:Promise<{device?:string;challenge?:string}>
}){
 const params=await searchParams;
 const device=typeof params.device==="string"?params.device:"";
 const challenge=typeof params.challenge==="string"?params.challenge:"";
 return <SecureStoreTerminal deviceId={device} challengeId={challenge}/>;
}
