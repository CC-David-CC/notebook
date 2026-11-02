import assert from 'node:assert/strict';
import {createJupytextClient} from '../apps/system/notebook/jupytext-client.mjs';
const instances=[];
class FakeWorker {constructor(){this.terminated=false;instances.push(this)}postMessage(request){this.request=request}terminate(){this.terminated=true}}
globalThis.Worker=FakeWorker;
const ac=new AbortController(),client=createJupytextClient(ac.signal);
const first=client.convert('read','x','py:light');instances[0].onmessage({data:{id:instances[0].request.id,result:'ok'}});assert.equal(await first,'ok');
const bad=client.convert('read','x','py:light');instances[0].onmessage({data:{id:instances[0].request.id,error:'bad input'}});await assert.rejects(bad,/bad input/);
const broken=client.convert('read','x','py:light');instances[0].onmessageerror();await assert.rejects(broken,/unreadable/);assert.ok(instances[0].terminated);
const next=client.convert('read','x','py:light');assert.equal(instances.length,2);ac.abort();await assert.rejects(next,{name:'AbortError'});assert.ok(instances[1].terminated);await assert.rejects(client.convert('read','x','py:light'),{name:'AbortError'});client.close();
const timer=globalThis.setTimeout,clear=globalThis.clearTimeout;let fire;globalThis.setTimeout=fn=>(fire=fn,1);globalThis.clearTimeout=()=>{};try{const stalled=createJupytextClient(),wait=stalled.convert('read','x','py:light');fire();await assert.rejects(wait,/timed out/);assert.ok(instances.at(-1).terminated);const retry=stalled.convert('read','x','py:light');instances.at(-1).onmessage({data:{id:instances.at(-1).request.id,result:'retry'}});assert.equal(await retry,'retry');stalled.close();}finally{globalThis.setTimeout=timer;globalThis.clearTimeout=clear;}
console.log('Notebook conversion worker failure, timeout, restart and cancellation passed.');
