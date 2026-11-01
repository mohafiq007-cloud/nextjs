import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=ts.transpileModule(fs.readFileSync(new URL("../app/co/auth/test-setup/page.tsx",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
async function page(env,enabled=true){
 const context=vm.createContext({process:{env}}),mod=new vm.SourceTextModule(source,{context});
 const deps={
  "next/navigation":{notFound:()=>{throw new Error("NOT_FOUND");}},
  "../../../../lib/mariz/neon-server":{neonEnabled:()=>enabled},
  "./test-account-setup":{default:()=>null},
  "react/jsx-runtime":{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
 };
 await mod.link(spec=>{const exports=deps[spec];assert.ok(exports);return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v);},{context});});
 await mod.evaluate();return mod.namespace.default;
}
for(const [name,env,enabled]of [
 ["production",{VERCEL_ENV:"production",VERCEL_GIT_COMMIT_REF:"feature/billplz-sandbox-adapter"},true],
 ["other preview branch",{VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"main"},true],
 ["missing deployment metadata",{},true],
 ["disabled auth",{VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feature/billplz-sandbox-adapter"},false],
])test("test account setup is unavailable in "+name,async()=>{const render=await page(env,enabled);assert.throws(render,/NOT_FOUND/);});
test("test account setup renders only on the configured sandbox preview",async()=>{
 const render=await page({VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feature/billplz-sandbox-adapter"});assert.equal(render().type,"main");
});
