import test from "node:test";
import assert from "node:assert/strict";
import {neonErrorCategory} from "../lib/mariz/neon-error-category.mjs";
import {neon,neonConfig} from "@neondatabase/serverless";

test("company lookup diagnostics distinguish authentication from privileges",()=>{
  assert.equal(neonErrorCategory({code:"28P01"}),"database_authentication_failed");
  assert.equal(neonErrorCategory({code:"42501"}),"database_permission_denied");
  assert.equal(neonErrorCategory({code:"42883"}),"database_function_missing");
});

test("classifies actual Neon driver HTTP and transport errors without secrets",async(t)=>{
  const originalFetch=neonConfig.fetchFunction;
  t.after(()=>{neonConfig.fetchFunction=originalFetch;});
  const secret="private-password-and-connection-url";
  const url="postgresql://diagnostic:dummy@ep-diagnostic.c-2.ap-southeast-1.aws.neon.tech/test";
  for(const [status,body,expected] of [
    [500,secret,"database_http_internal_error"],
    [503,secret,"database_http_unavailable"],
    [421,secret,"database_http_misdirected"],
    [429,secret,"database_http_rate_limited"],
    [401,secret,"database_http_unauthorized"],
    [500,`password authentication failed ${secret}`,"database_authentication_failed"],
  ]){
    neonConfig.fetchFunction=async()=>new Response(body,{status});
    const sql=neon(url);
    await assert.rejects(sql.query("SELECT 1"),error=>{
      assert.equal(neonErrorCategory(error),expected);
      assert.ok(!neonErrorCategory(error).includes(secret));
      return true;
    });
  }
  neonConfig.fetchFunction=async()=>{
    throw new TypeError(secret,{cause:{code:"ENOTFOUND"}});
  };
  const sql=neon(url);
  await assert.rejects(sql.query("SELECT 1"),error=>{
    assert.equal(neonErrorCategory(error),"database_dns_failed");
    return true;
  });
});

test("unknown and hostile diagnostic input remains fixed and secret-free",()=>{
  assert.equal(neonErrorCategory({message:"Server error (HTTP status 599): secret"}),"database_http_error");
  assert.equal(neonErrorCategory({sourceError:{code:"secret"}}),"database_transport_failed");
  assert.equal(neonErrorCategory({code:"53300"}),"database_sql_error");
  assert.equal(neonErrorCategory({get message(){throw new Error("secret");}}),"database_request_failed");
});

test("company lookup diagnostics never copy driver messages or arbitrary codes",()=>{
  const secret="private-password-and-connection-url";
  for(const error of [null,undefined,secret,{message:secret,stack:secret,code:secret},
    {code:"28P01",message:secret,connectionString:secret},
    {get code(){throw new Error(secret);}}]){
    assert.ok(!neonErrorCategory(error).includes(secret));
  }
  assert.equal(neonErrorCategory({code:secret}),"database_request_failed");
});
