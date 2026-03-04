#!/usr/bin/env node
/**
 * Cloudflare Access 配置脚本
 * 为 vid.mgtv.dev 创建访问限制（用户名+密码验证）
 *
 * 使用前请：
 * 1. 创建 API Token：https://dash.cloudflare.com/profile/api-tokens
 * 2. 将 CLOUDFLARE_API_TOKEN 写入 .env 或设置为环境变量
 * 3. 确保已开通 Zero Trust：https://one.dash.cloudflare.com/
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 自动加载 .env（从项目根目录，即 scripts 的上级）
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '0f0b7b5320f7022bf49994c35f002ab3';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = 'vid.mgtv.dev';

if (!API_TOKEN) {
  console.error('❌ 请设置环境变量 CLOUDFLARE_API_TOKEN');
  console.error('   创建 Token: https://dash.cloudflare.com/profile/api-tokens');
  console.error('   选择「创建自定义令牌」，在账户权限中添加 Cloudflare Zero Trust 的「编辑」权限');
  console.error('   或在 Zero Trust 控制台: https://one.dash.cloudflare.com/ → Settings → API');
  process.exit(1);
}

const api = async (path, options = {}) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(JSON.stringify(data.errors || data));
  }
  return data;
};

async function main() {
  console.log('🔐 正在配置 Cloudflare Access...\n');

  // 1. 获取或创建 Access 应用
  let appId;
  const listRes = await api('/access/apps');
  const existing = listRes.result?.find((a) => a.domain === DOMAIN || a.domains?.includes(DOMAIN));
  if (existing) {
    appId = existing.id;
    console.log(`1️⃣ 使用已有应用 (ID: ${appId})\n`);
  } else {
    console.log('1️⃣ 创建 Access 应用...');
    const appRes = await api('/access/apps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'StreamFlix',
        domain: DOMAIN,
        type: 'self_hosted',
        session_duration: '24h',
      }),
    });
    appId = appRes.result.id;
    console.log(`   ✅ 应用已创建 (ID: ${appId})\n`);
  }

  // 2. 创建策略：要求有效身份验证（Cloudflare Identity 登录用户）
  console.log('2️⃣ 创建访问策略（要求登录）...');
  await api(`/access/apps/${appId}/policies`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Require Login',
      decision: 'allow',
      include: [{ email: { email: 'pennfly2008@gmail.com' } }],
    }),
  });
  console.log('   ✅ 策略已创建\n');

  console.log('✨ 配置完成！');
  console.log(`\n📌 访问 https://${DOMAIN} 时将要求登录`);
  console.log('\n📝 下一步：在 Zero Trust 控制台添加用户');
  console.log('   https://one.dash.cloudflare.com/ → Access → Authentication → Users');
  console.log('   点击 "Add users" 添加邮箱和密码，用户即可登录访问\n');
}

main().catch((err) => {
  console.error('❌ 配置失败:', err.message);
  if (err.message.includes('8000014') || err.message.includes('already exists')) {
    console.error('\n💡 该域名可能已配置 Access，请到 Zero Trust 控制台查看');
    console.error('   https://one.dash.cloudflare.com/ → Access → Applications\n');
  }
  process.exit(1);
});
