import {redirect} from "next/navigation";
import PosV2Demo from "../../../pos-v2/pos-v2-demo";
import {currentVerifiedUser,isVerifiedCompanyMember,neonEnabled} from "../../../../lib/mariz/neon-server";
export const dynamic="force-dynamic";
export const metadata={title:"MARIZ POS — Prepared Demo",robots:{index:false,follow:false}};
export default async function POSPreview(){
 if(neonEnabled()){
  const user=await currentVerifiedUser();
  if(!user)redirect("/co/auth");
  let approved=false;
  try{approved=await isVerifiedCompanyMember(user.id);}catch{redirect("/co/workspace");}
  if(!approved)redirect("/co/workspace");
 }
 return <PosV2Demo/>;
}
