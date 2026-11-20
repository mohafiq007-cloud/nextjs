import crypto from "node:crypto";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(process.env.MARIZ_ENABLE_LALAMOVE_QUOTES!=="true")return res.status(503).json({error:"Live quotations disabled until merchant authentication and usage controls are configured."});
  const key=process.env.LALAMOVE_API_KEY,secret=process.env.LALAMOVE_API_SECRET;
  if(!key||!secret)return res.status(503).json({error:"Lalamove not configured"});
  const v=req.body||{},validStop=o=>o&&typeof o.address==="string"&&o.address.trim().length>=6&&o.address.length<=300&&Number.isFinite(+o.lat)&&Number.isFinite(+o.lng)&& +o.lat>=-90&&+o.lat<=90&&+o.lng>=-180&&+o.lng<=180;
  if(!validStop(v.pickup)||!validStop(v.dropoff)||!["MOTORCYCLE","CAR","VAN"].includes(v.serviceType))return res.status(400).json({error:"A valid pickup, dropoff and service type are required"});
  const stop=o=>({coordinates:{lat:String(o.lat),lng:String(o.lng)},address:o.address.trim()});
  const payload={data:{serviceType:v.serviceType,language:"en_MY",stops:[stop(v.pickup),stop(v.dropoff)]}};
  if(v.scheduleAt){let date=new Date(v.scheduleAt);if(!Number.isFinite(date.getTime())||date.getTime()<=Date.now())return res.status(400).json({error:"Invalid schedule"});payload.data.scheduleAt=date.toISOString()}
  const body=JSON.stringify(payload),path="/v3/quotat¶»§q«^