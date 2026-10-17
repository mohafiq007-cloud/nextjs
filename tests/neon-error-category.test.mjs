import test from "node:test";
import assert from "node:assert/strict";
import {neonErrorCategory} from "../lib/mariz/neon-error-category.mjs";

test("company lookup diagnostics distinguish authentication from privileges",()=>{
  assert.equal(neonErrorCategory({code:"28P01"}),"database_authentication_failed");
  assert.equal(neonErrorCategory({code:"42501"}),"database_permission_denied");
  assert.equal(neonErrorCategory({code:"42883"}),"database_function_missing");
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
