# Python Notebook

This app embeds JupyterLite with the browser-local Pyodide Python kernel. Run
Python in the notebook; Linux terminal programs and subprocesses use the
separate temporary v86 environment and are not the Pyodide kernel.
New notebooks start with an editable example that calculates the mean of
measurements. Run it with Shift+Enter or the notebook's Run button. The
collapsible getting-started guide explains this and the storage boundary.

Use **Open from My files** for a saved `.ipynb`, or choose a folder and select
**Save to Files**. The notebook is saved to the account's browser storage and
then synchronized with the server. After the first save, changes are saved
automatically while the window remains open, including edits made during the first save. Check the status for save errors
or conflicts. Upload files from the computer using Files first. Invalid files
leave the current notebook available. The copy used internally by JupyterLite
has a random name and is scoped to the account in the browser.

JupyterLite executes notebook code with the website's browser permissions; do
not open untrusted notebooks as though they were isolated from your account.
Python packages and native processes are subject to Pyodide's browser limits.
On ordinary window close, the app requests cleanup of that window’s temporary
JupyterLite working copies and checkpoints. Cleanup is best effort: browser
crashes, interrupted startup, older copies or future JupyterLite storage-layout
changes can leave temporary data behind. Account files in My files are the
supported persistent copies. Physical-phone behavior
and all Jupyter extensions have not been verified.

Build inputs are described in `app.json`, `requirements-build.txt` and
`prepare.py`. Generated JupyterLite assets are build inputs rather than source.

A separate notice stays visible when My files detects that the linked notebook changed, is unavailable, or has conflicting copies. The notebook remains open; resolve conflicts in Files or save a separate copy. Automatic saves that retain a local conflict report that resolution is needed rather than claiming server sync. Detection depends on account-mirror synchronization. Local desktop, emulated-phone and 4K and live emulated-phone account tests cover conflicts during automatic saves, a conflict while a write is in progress, preserved copies, fresh-session recovery and listener cleanup.
