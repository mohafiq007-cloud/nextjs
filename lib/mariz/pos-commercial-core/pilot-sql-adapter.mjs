/** Server-only binding for EXISTING CO and billing connections. No credentials,
 * pool creation, Auth, direct browser exposure or automatic production enabling.
 * call(query, params) must return rows and bind parameters, never interpolate SQL.
 */
export function pilotSqlAdapter({co,billing,issuance}){
 const one=async(db,sql,args)=>(await db(sql,args))[0]?.result;
 return {
  coContext:(actor,outlet)=>one(co,'SELECT mariz_private.pos_commercial_context($1::uuid,$2::uuid) result',[actor,outlet]),
  billing:{
   quote:(actor,company,outlet,key,offer)=>one(billing,'SELECT mariz_billing_live.create_pos_pilot_quote($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5) result',[actor,company,outlet,key,offer]),
   accept:(actor,company,id,digest,collection,customer,outlet)=>one(billing,'SELECT mariz_billing_live.accept_pos_pilot_quote_scoped($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6,$7,$8) result',[actor,company,outlet,id,digest,collection,customer.name,customer.email]),
   // Preserve the host's existing operator/issuance boundary. Its sandbox
   // implementation must be supplied explicitly, never a live adapter fallback.
   claim:issuance.claim,register:issuance.register,uncertain:issuance.uncertain,
   expected:issuance.expected,observe:issuance.observe,
   reconcile:(request,bill,digest)=>one(billing,'SELECT mariz_billing_live.reconcile_pos_pilot_payment($1::uuid,$2::uuid,$3,$4,$5::integer,$6,$7) result',[request.id,request.organization_id,bill.id,bill.collection_id,bill.amount,request.currency,digest]),
   queue:id=>one(billing,'SELECT mariz_billing_live.queue_verified_pos_order($1::uuid) result',[id])
  }
 };
}
