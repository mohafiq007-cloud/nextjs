const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateOrderRequest(body) {
 if(!body || Object.keys(body).sort().join(',')!=='items,organization_id,request_key' ||
 !uuid.test(body.organization_id)||!uuid.test(body.request_key)||!Array.isArray(body.items)||body.items.length<1||body.items.length>50)throw Error('Invalid order');
 const ids=new Set();
 for(const line of body.items){
  if(!line||Object.keys(line).sort().join(',')!=='product_id,quantity'||!uuid.test(line.product_id)||
   !Number.isInteger(line.quantity)||line.quantity<1||line.quantity>99||ids.has(line.product_id.toLowerCase()))throw Error('Invalid order line');
  ids.add(line.product_id.toLowerCase());
 }
 return {p_organization:body.organization_id,p_request_key:body.request_key,p_items:body.items};
}
