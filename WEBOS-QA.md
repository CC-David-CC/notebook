# Python Notebook qualification

Launch **Programming → Python Notebook (JupyterLite + Pyodide)**. The app uses the browser Python kernel and an account-scoped JupyterLite working directory. Use My files for the portable notebook and any Python input or output that needs to persist.

## Build and entry point

Use `prepare.py --site` to prepare the pinned JupyterLite runtime outside the checkout, then pass that directory to the WebOS viewer builder with `--notebook-site`. The app mounts through `index.mjs` and the runtime starts through `bootstrap.mjs`.

## Phone workflow

The baseline covers four of six ordinary workflows. Run a notebook, save and reopen an editable notebook, import a dataset, and export a Python-generated result. Python-text format conversion and recovery from file conflicts remain separate checks.

1. In a disposable signed-in session, open Notebook and use **Run cell** on the starter example. It returns `Mean: 12.10`.
2. Tap **Save notebook**. The suggested path is `/Notebook.ipynb`. Enter `Phone notebook QA` and save.
3. Close Notebook. Open `Phone notebook QA.ipynb` from My files. Notebook launches with the original editable cell.
4. Import a CSV containing 7 and 5 into the Python working directory. A cell reading the file prints `QA total: 12` and writes that number to a text file.
5. Use **Save Python output** to copy the generated file into My files. Confirm that the synced account file contains exactly `12`.

This passed on a physical Samsung Galaxy S10+ with Chrome `158.0.8127.92`, a 411 CSS-pixel portrait viewport, and a preview of Notebook source `3075789`. A phone-width Chromium test also reopened the notebook from a fresh browser profile. [Physical phone screenshot and reproduction](https://github.com/CC-David-CC/notebook/blob/webos/qa-phone/docs/qa/PHONE.md)

## Wide layouts

At 1400 CSS pixels, the standard Jupyter File menu saved a bare name as an `.ipynb` file and reopened it through My files. At 820 CSS pixels with the app maximized, the WebOS app bar and standard File menu were visible and Save As suggested the existing full filename. Continue desktop workflow scoring by testing Python-text formats, notebook recovery and guest persistence on the current candidate.

The phone screenshot shows a light Jupyter editor inside the dark WebOS frame. The Jupyter editor's default theme and the tab's internal working name are open usability items. The tested wrapper is staged locally for release qualification.
