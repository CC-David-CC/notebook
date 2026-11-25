import test from 'node:test';
import assert from 'node:assert/strict';
import {pythonKernelArgs, waitForNotebookApp, waitForPython, waitForPythonSpec} from "../../kernel-start.mjs";
test('only default Python notebooks receive a kernel override',()=>{
  const arg={kernelPreference:{name:'python',autoStartDefault:true}};
  assert.deepEqual(pythonKernelArgs({metadata:{}},true),arg);
  assert.deepEqual(pythonKernelArgs({metadata:{kernelspec:{name:'python'}}}),arg);
  assert.deepEqual(pythonKernelArgs({metadata:{kernelspec:{name:'foreign'}}},true),{});
  assert.deepEqual(pythonKernelArgs({metadata:{}},false),{});
});
test('wait for Python to register and report a missing kernel without falling back',async()=>{
  let time=0;
  const waiting={valid:()=>true,now:()=>time,timeout:750,delay:async ms=>{time+=ms;}};
  await waitForPythonSpec(()=>({kernelspecs:time>=500 ? {python:{}} : {other:{}}}),waiting);
  assert.equal(time,500);
  time=0;
  await assert.rejects(waitForPythonSpec(()=>({kernelspecs:{other:{}}}),waiting),/unavailable/);
  assert.equal(time,750);
});
test('readiness waits for connected idle Python and bounds failure',async()=>{
  let time=0;const k={name:'python',status:'starting',connectionStatus:'connected'};
  const wait=waitForPython({sessionContext:{session:{kernel:k}}},{valid:()=>true,now:()=>time,delay:async()=>{time+=100;k.status='idle';}});
  await wait;assert.equal(time,100);
  await assert.rejects(waitForPython({sessionContext:{session:{kernel:{name:'python',status:'dead'}}}}, {valid:()=>true}),/stopped during startup/);
  time=0;await assert.rejects(waitForPython({}, {valid:()=>true,now:()=>time,timeout:300,delay:async()=>{time+=100;}}),/did not become ready/);
});
test('closing a window cancels startup polling',async()=>{
  let active=true,calls=0;await waitForPython({}, {valid:()=>active,delay:async()=>{calls++;active=false;}});assert.equal(calls,1);
});

test('browser editor waits for both its contents service and open command', async () => {
  let time = 0;
  const app = {serviceManager:{contents:{}}, commands:{hasCommand: name => name==='docmanager:open' && time>=500}};
  const result = await waitForNotebookApp(() => app, {
    valid:()=>true, now:()=>time, delay:async ms=>{time+=ms;}
  });
  assert.equal(result, app);
  assert.equal(time, 500);
});

test('a stalled notebook boot ends at its deadline and a closed window cancels the wait', async () => {
  let time = 0;
  await assert.rejects(waitForNotebookApp(() => undefined, {
    valid:()=>true, now:()=>time, timeout:500, delay:async ms=>{time+=ms;}
  }), /did not finish loading/);
  assert.equal(time,500);
  const cancelled=await waitForNotebookApp(() => assert.fail('Frame was already removed'),{valid:()=>false});
  assert.equal(cancelled,undefined);
});

test('an inaccessible frame reports a startup error', async () => {
  await assert.rejects(waitForNotebookApp(() => {throw new DOMException('Frame failed','SecurityError');},
    {valid:()=>true}), /could not be loaded/);
});
