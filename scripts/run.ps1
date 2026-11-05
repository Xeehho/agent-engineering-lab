param(
  [ValidateSet('install', 'dev', 'check', 'doctor', 'practice:stage1')]
  [string]$Task = 'dev'
)
$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskProjectRoot
try {
  $taskNodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $taskNodeMajor = if ($taskNodeCommand) { & $taskNodeCommand.Source -p "process.versions.node.split('.')[0]" } else { '' }
  if ($taskNodeMajor -ne '24') {
    $taskBundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (!(Test-Path -LiteralPath $taskBundledNode)) { throw 'Install Node.js 24 LTS and reopen your terminal.' }
    $taskBundledMajor = & $taskBundledNode -p "process.versions.node.split('.')[0]"
    if ($taskBundledMajor -ne '24') { throw 'This course requires Node.js 24 LTS.' }
    $env:PATH = (Split-Path -Parent $taskBundledNode) + ';' + $env:PATH
    Write-Output 'Using existing bundled Node 24 for this process.'
  }
  $taskNpmCommand = Get-Command npm.cmd -ErrorAction Stop
  $taskNpmCli = Join-Path (Split-Path -Parent $taskNpmCommand.Source) 'node_modules\npm\bin\npm-cli.js'
  if (!(Test-Path -LiteralPath $taskNpmCli)) { throw 'Could not locate npm CLI; use a standard Node.js 24 installation.' }
  if ($Task -eq 'install') { & node $taskNpmCli install }
  else { & node $taskNpmCli run $Task }
  $taskExitCode = $LASTEXITCODE
} finally { Pop-Location }
exit $taskExitCode

