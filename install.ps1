# Windows: copy every skill into each agent tool's skills dir (no symlink rights needed).
# Skips mattpo so its upstream names (tdd, teach) are not copied over global skills. Re-run after git pull.
$here = $PSScriptRoot
foreach ($tool in '.claude','.codex','.cursor','.gemini','.agents') {
  $root = Join-Path $HOME $tool
  if (-not (Test-Path $root)) { continue }
  $dst = Join-Path $root 'skills'; New-Item -ItemType Directory -Force $dst | Out-Null
  foreach ($s in Get-ChildItem "$here\*\skills\*" -Directory) {
    if ($s.Parent.Parent.Name -eq 'mattpo') { continue }
    $t = Join-Path $dst $s.Name
    if ((Test-Path $t) -and (Get-Item $t -Force).LinkType) { continue }   # skip existing links
    Copy-Item $s.FullName $dst -Recurse -Force
  }
}
'done'
