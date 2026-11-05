import './check-node.mjs';
import { existsSync } from 'node:fs';
console.log(JSON.stringify({
  node: process.version, dependenciesInstalled: existsSync('node_modules/react'),
  provider: 'mock only', realModelVerified: false,
  stage01: 'not assessed; check private learning progress; shared example is not a grade',
}, null, 2));
