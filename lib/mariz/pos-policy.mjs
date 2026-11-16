/**
 * Pure, offline-testable POS V2 domain rules. NOT authentication by itself.
 * Server database functions and trusted device credentials still enforce real access.
 */
export const MAX_MYRM_MINOR = 100000000;

export function parseMyrMinor(value) {
  const input=String(value).trim();
  if (!/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,2})?$/.test(input))
    throw new Error("Invalid MYR amount: use up to two decimals.");
  const [whole,fraction=""]=input.split(".");
  const amount=Number(whole)*100+Number((fraction+"00").slice(0,2));
  if (!Number.isSafeInteger(amount)||amount>MAX_MYRM_MINOR) throw new Error("Amount out of range.");
  return amount;
}
export function lineTotalMinor(unitPriceMinor,qty) {
  if(!Number.isSafeInteger(unitPriceMinor)||unitPriceMinor<0)throw new Error("Invalid unit price.");
  if(!Number.isInteger(qty)||qty<1||qty>10000)throw new Error("Invalid quantity.");
  const total=unitPriceMinor*qty;
  if(!Number.isSafeInteger(total)||total>MAX_MYRM_MINOR)throw new Error("Line exceeds safe limit.");
  return total;
}
export function orderTotalMinor(lines) {
  if(!Array.isArray(lines)||lines.length===0||lines.length>200)throw new Error("Invalid order line count.");
  const total=lines.reduce((sum,line)=>sum+lineTotalMinor(line.unitPriceMinor,line.quantity),0);
  if(!Number.isSafeInteger(total)||total>MAX_MYRM_MINOR)throw new Error("Order exceeds safe limit.");
  return total;
}
export function isPosAdminAllowed({companyVerification,subscription,memberRole}) {
  return companyVerification==="verified"&&subscription==="active"&&["owner","admin"].includes(memberRole);
}
export function validatePairingExpiry({expiresAt,usedAt,attempts},at=Date.now()) {
  if(usedAt) return false;
  if(!Number.isInteger(attempts)||attempts>=5) return false;
  const expiry=Date.parse(expiresAt);
  return Number.isFinite(expiry)&&expiry>at&&expiry-at<=10*60*1000;
}
export function verifySaleTender({totalMinor,receivedMinor}) {
  if(!Number.isSafeInteger(totalMinor)||totalMinor<0||!Number.isSafeInteger(receivedMinor)||receivedMinor<0)
    throw new Error("Invalid tender totals.");
  // Greater tender does not increase sales revenue; change/credit handled separately.
  return {revenueMinor:totalMinor,changeMinor:receivedMinor>totalMinor?receivedMinor-totalMinor:0,
    outstandingMinor:receivedMinor<totalMinor?totalMinor-receivedMinor:0};
}
