import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parseMyrMinor,lineTotalMinor,orderTotalMinor,isPosAdminAllowed,validatePairingExpiry,verifySaleTender} from "../lib/mariz/pos-policy.mjs";

test("MYR parsing is exact in integer cents",()=>{
 assert.equal(parseMyrMinor("16.90"),1690);
 assert.equal(parseMyrMinor("0.05"),5);
 assert.equal(parseMyrMinor("12"),1200);
 for(const bad of ["-1","1.001","1e3","NaN","", "01.0"])assert.throws(()=>parseMyrMinor(bad));
});
test("line and order amounts reject overflow and bad quantity",()=>{
 assert.equal(lineTotalMinor(1690,3),5070);
 assert.equal(orderTotalMinor([{unitPriceMinor:1690,quantity:2},{unitPriceMinor:1100,quantity:1}]),4480);
 assert.throws(()=>lineTotalMinor(100,0));
 assert.throws(()=>lineTotalMinor(99999999,100));
 assert.throws(()=>orderTotalMinor([]));
});
test("KYB, plan activation and role all gate back-office management",()=>{
 assert.equal(isPosAdminAllowed({companyVerification:"verified",subscription:"active",memberRole:"owner"}),true);
 for(const scenario of [
  {companyVerification:"pending",subscription:"active",memberRole:"owner"},
  {companyVerification:"verified",subscription:"pending",memberRole:"owner"},
  {companyVerification:"verified",subscription:"active",memberRole:"member"},
 ])assert.equal(isPosAdminAllowed(scenario),false);
});
test("pairing challenge cannot be replayed, expired or brute-forced",()=>{
 const now=Date.now(),base={expiresAt:new Date(now+90000).toISOString(),usedAt:null,attempts:0};
 assert.equal(validatePairingExpiry(base,now),true);
 assert.equal(validatePairingExpiry({...base,attempts:5},now),false);
 assert.equal(validatePairingExpiry({...base,usedAt:new Date(now-10).toISOString()},now),false);
 assert.equal(validatePairingExpiry({...base,expiresAt:new Date(now-1).toISOString()},now),false);
 assert.equal(validatePairingExpiry({...base,expiresAt:new Date(now+3600000).toISOString()},now),false);
});
test("overpayment does not inflate sale revenue",()=>{
 assert.deepEqual(verifySaleTender({totalMinor:19500,receivedMinor:20000}),
 {revenueMinor:19500,changeMinor:500,outstandingMinor:0});
 assert.deepEqual(verifySaleTender({totalMinor:19500,receivedMinor:15000}),
 {revenueMinor:19500,changeMinor:0,outstandingMinor:4500});
});
test("official full PNG is present in the repository",()=>{
 const file=fs.readFileSync(new URL("../public/mariz-original-logo.png",import.meta.url));
 assert.equal(file.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
});
test("V2 does not market MARIZ Events or MARIZ CO as products",()=>{
 const page=fs.readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
 assert.equal(page.includes("MARIZ Events"),false);
 assert.ok(page.includes("Custom Web Software"));
 assert.ok(page.includes('name: "MARIZ POS"'));
 assert.ok(page.includes("/mariz-original-logo.png"));
});
test("V2 sample POS is ready with a paired terminal and simulated only",()=>{
 const pos=fs.readFileSync(new URL("../app/pos-v2/pos-v2-demo.tsx",import.meta.url),"utf8");
 assert.ok(pos.includes('id:1,name:"Counter 01",outlet:"Sample Café — Main",paired:true'));
 assert.ok(pos.includes("NO REAL LOGIN"));
 assert.ok(pos.includes("setSales("));
});
