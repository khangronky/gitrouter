$files = @(
   "src\lib\api\repositories\index.ts",
  "src\lib\schema\repository.ts"
)

$src = "E:\Code\gitrouter"
$dst = "E:\Code\gitrouter-1"

foreach ($file in $files) {
  $srcPath = Join-Path $src $file
  $dstPath = Join-Path $dst $file
  $dstDir = Split-Path $dstPath
  New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
  Copy-Item -LiteralPath $srcPath -Destination $dstPath -Force
}