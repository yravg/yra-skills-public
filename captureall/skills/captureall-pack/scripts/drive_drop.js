/* Drive upload helper for Claude in Chrome.
 * 1) Open a tab on https://drive.google.com/drive/folders/<folderId>, then javascript_tool with DRIVE_DROP_PREP (once per page load).
 * 2) find "file input element" -> ref.  3) file_upload(ref, paths) — ≤10 MB per call; paths in the working dir (/home/claude/...), not /mnt/user-data.
 * 4) javascript_tool: window.__rcFire()  (returns immediately; Drive keeps uploading in the background).
 * Repeat 3–4 per batch with the same ref. 5) ~30–60 s later verify with Drive search_files parentId='<folderId>' (paginate; compare fileSize). */
// DRIVE_DROP_PREP
(() => { let i = document.getElementById('__rc_up'); if (i) i.remove(); i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.id = '__rc_up';
  i.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;opacity:0.01;width:10px;height:10px'; document.body.appendChild(i);
  window.__rcFire = () => { const inp = document.getElementById('__rc_up'); const names = [...inp.files].map(f => f.name);
    const mk = () => { const dt = new DataTransfer(); [...inp.files].forEach(f => dt.items.add(f)); return dt; };
    const x = Math.round(innerWidth * 0.55), y = Math.round(innerHeight * 0.55), tgt = document.elementFromPoint(x, y);
    ['dragenter', 'dragover', 'drop'].forEach(t => tgt.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, composed: true, dataTransfer: mk(), clientX: x, clientY: y })));
    return 'dropped: ' + names.join(', '); };
  return 'ready'; })();
