import test from 'node:test';import assert from 'node:assert/strict';
import {validateOrderRequest} from '../server/order-request.mjs';
const id='11111111-1111-4111-8111-111111111111';
const body=()=>({organization_id:id,request_key:id,items:[{product_id:id,quantity:2}]});
test('order request only accepts product identities and quantities',()=>{assert.equal(validateOrderRequest(body()).p_items[0].quantity,2);});
test('customer price and paid flags cannot reach RPC',()=>{
 for(const extra of [{paid:true},{total_sen:1},{actor:id}])assert.throws(()=>validateOrderRequest({...body(),...extra}));
 const b=body();b.items[0].unit_price_sen=1;assert.throws(()=>validateOrderRequest(b));
});
test('invalid quantities, duplicate products and oversized carts are rejected',()=>{
 for(const quantity of [0,-1,1.5,100,'2']){const b=body();b.items[0].quantity=quantity;assert.throws(()=>validateOrderRequest(b));}
 const b=body();b.items.push({...b.items[0]});assert.throws(()=>validateOrderRequest(b));
 assert.throws(()=>validateOrderRequest({...body(),items:[]}));
});
