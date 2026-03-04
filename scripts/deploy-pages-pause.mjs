#!/usr/bin/env node
/**
 * 部署「站点暂停」页面到 Cloudflare Pages，停止跑流量
 * 恢复时执行: npm run deploy
 */
import { execSync } from 'child_process';
import { existsSync, renameSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
const envPath = resolve(root, '.env');
const envBak = resolve(root, '.env.deploy-bak');

if (existsSync(envPath)) {
  renameSync(envPath, envBak);
}
try {
  execSync('npx wrangler pages deploy maintenance --project-name=streamflix', {
    stdio: 'inherit',
    cwd: root,
  });
  console.log('\n已部署暂停页，vid.mgtv.dev 现显示维护中，流量已停止。');
  console.log('恢复站点: npm run deploy');
} finally {
  if (existsSync(envBak)) {
    renameSync(envBak, envPath);
  }
}
