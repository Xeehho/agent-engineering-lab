import './check-node.mjs';
import { existsSync } from 'node:fs';
console.log(JSON.stringify({
  node: process.version, dependenciesInstalled: existsSync('node_modules/react'),
  provider: 'mock only', realModelVerified: false,
  stage01: 'not assessed; check learning/progress.json',
}, null, 2));
