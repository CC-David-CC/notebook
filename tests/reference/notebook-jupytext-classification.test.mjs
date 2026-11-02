import assert from 'node:assert/strict';
import {authoredContent, authoredModel, notebookFormat, textLoss} from '../apps/system/notebook/jupytext-client.mjs';
const original={metadata:{},cells:[{cell_type:'code',source:'print(1)',metadata:{},execution_count:null,outputs:[]},{cell_type:'markdown',source:'First line\n\nSecond line',metadata:{}}]};
const executed=structuredClone(original);executed.cells[0].execution_count=1;executed.cells[0].outputs=[{output_type:'stream',name:'stdout',text:'1\n'}];
assert.equal(authoredContent(original),authoredContent(executed));
assert.equal(textLoss(original),false);assert.equal(textLoss(executed),true);
const edited=structuredClone(executed);edited.cells[0].source=['print(', '2)'];assert.notEqual(authoredContent(original),authoredContent(edited));
assert.equal(notebookFormat('/a.light.py'),'py:light');assert.equal(notebookFormat('/a.percent.py'),'py:percent');assert.equal(notebookFormat('/a.ipynb'),'ipynb');assert.equal(notebookFormat('/a.py'),null);
console.log('Notebook format and source-change classification passed.');
const model={cells:{length:1,get:()=>({type:'code',sharedModel:{getSource:()=> 'print(1)'}})},toJSON(){throw Error('Outputs must not be copied')}};assert.equal(authoredModel(model),JSON.stringify([{type:'code',source:'print(1)'}]));

const starter={metadata:{kernelspec:{display_name:'Python (Pyodide)',language:'python',name:'python'}},cells:[{cell_type:'code',metadata:{},outputs:[],source:'print(1)'}]};assert.equal(textLoss(starter),false);const custom=structuredClone(starter);custom.metadata.kernelspec.custom='important';assert.equal(textLoss(custom),true);const withOutput=structuredClone(starter);withOutput.cells[0].outputs=[{output_type:'stream',text:'1'}];assert.equal(textLoss(withOutput),true);

const jl=structuredClone(starter);jl.metadata.language_info={codemirror_mode:{name:'python',version:3},file_extension:'.py',mimetype:'text/x-python',name:'python',nbconvert_exporter:'python',pygments_lexer:'ipython3',version:'3.8'};assert.equal(textLoss(jl),false);jl.metadata.language_info.version='3.14';assert.equal(textLoss(jl),true);

const initializing=structuredClone(starter);initializing.metadata.language_info={name:''};assert.equal(textLoss(initializing),false);initializing.metadata.language_info.custom='data';assert.equal(textLoss(initializing),true);
