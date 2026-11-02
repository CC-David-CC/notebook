import assert from 'node:assert/strict';
import {authoredContent, notebookFormat, textLoss} from '../apps/system/notebook/jupytext-client.mjs';
const original={metadata:{},cells:[{cell_type:'code',source:'print(1)',metadata:{},execution_count:null,outputs:[]},{cell_type:'markdown',source:'First line\n\nSecond line',metadata:{}}]};
const executed=structuredClone(original);executed.cells[0].execution_count=1;executed.cells[0].outputs=[{output_type:'stream',name:'stdout',text:'1\n'}];
assert.equal(authoredContent(original),authoredContent(executed));
assert.equal(textLoss(original),false);assert.equal(textLoss(executed),true);
const edited=structuredClone(executed);edited.cells[0].source=['print(', '2)'];assert.notEqual(authoredContent(original),authoredContent(edited));
assert.equal(notebookFormat('/a.light.py'),'py:light');assert.equal(notebookFormat('/a.percent.py'),'py:percent');assert.equal(notebookFormat('/a.ipynb'),'ipynb');assert.equal(notebookFormat('/a.py'),null);
console.log('Notebook format and source-change classification passed.');
