#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, renameSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
const envPath = resolve(root, '.env');
const envBak = resolve(root, '.env.deploy-bak');

// 临时移走 .env，避免 CLOUDFLARE_API_TOKEN 覆盖 wrangler OAuth（OAuth 含 Pages 权限）
let restored = false;
if (existsSync(envPath)) {
  renameSync(envPath, envBak);
  restored = true;
}
try {
  execSync('npx wrangler pages deploy dist --project-name=streamflix', {
    stdio: 'inherit',
    cwd: root,
  });
} finally {
  if (restored && existsSync(envBak)) {
    renameSync(envBak, envPath);
  }
}
