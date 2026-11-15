import test from 'node:test';
import assert from 'node:assert/strict';
import {pythonKernelArgs, waitForPython, requirePythonSpec} from "../../kernel-start.mjs";
test('only default Python notebooks receive a kernel override',()=>{
  const arg={kernelPreference:{name:'python',autoStartDefault:true}};
  assert.deepEqual(pythonKernelArgs({metadata:{}},true),arg);
  assert.deepEqual(pythonKernelArgs({metadata:{kernelspec:{name:'python'}}}),arg);
  assert.deepEqual(pythonKernelArgs({metadata:{kernelspec:{name:'foreign'}}},true),{});
  assert.deepEqual(pythonKernelArgs({metadata:{}},false),{});
});
test('missing Python cannot silently fall back',()=>{assert.throws(()=>requirePythonSpec({kernelspecs:{other:{}}}),/unavailable/);assert.doesNotThrow(()=>requirePythonSpec({kernelspecs:{python:{}}}));});
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
