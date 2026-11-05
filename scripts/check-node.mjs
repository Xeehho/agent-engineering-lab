const major = Number(process.versions.node.split('.')[0]);
if (major !== 24) {
  console.error('This lab uses Node.js 24 LTS. Current: ' + process.version);
  console.error('On this Windows machine: powershell -File scripts/run.ps1 install');
  process.exit(1);
}
