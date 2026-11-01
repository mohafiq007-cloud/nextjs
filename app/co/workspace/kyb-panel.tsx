import {coRpc} from '../../../lib/mariz/neon-server';
import {kybStorageConfigured} from '../../../lib/mariz/kyb-storage';
import VerificationDocuments, {type KybState} from './verification-flow';
export default async function KybPanel({organizationId}:{organizationId:string}){
 let state:KybState;try{state=await coRpc<KybState>('api_kyb_state',{p_organization:organizationId});}catch{return <p>Verification details are temporarily unavailable. Refresh to retry.</p>;}
 return <VerificationDocuments organizationId={organizationId} state={state} uploadsEnabled={kybStorageConfigured()}/>;
}
