#!/usr/bin/env node
/**
 * 配置 R2 自动同步到 D1
 * 1. 创建 Queue: streamflix-r2-events
 * 2. 为 R2 桶 pf2008 添加 object-create / object-delete 事件通知（前缀 video/）
 *
 * 执行前需先部署 Worker: npm run deploy:api
 * 执行: node scripts/setup-r2-sync.mjs
 */

import { execSync } from "child_process";

const BUCKET = "pf2008";
const QUEUE = "streamflix-r2-events";

function run(cmd, opts = {}) {
  console.log("$", cmd);
  try {
    execSync(cmd, { stdio: "inherit", ...opts });
  } catch (e) {
    if (e.status !== 0) throw e;
  }
}

async function main() {
  console.log("=== 1. 创建 Queue ===");
  try {
    run(`npx wrangler queues create ${QUEUE}`);
  } catch {
    console.log("Queue 可能已存在，继续");
  }

  console.log("\n=== 2. 部署 Worker（含 Cron + Queue Consumer）===");
  run("cd workers && npx wrangler deploy");

  console.log("\n=== 3. 添加 R2 事件通知 (object-create, prefix: video/) ===");
  try {
    run(
      `npx wrangler r2 bucket notification create ${BUCKET} --event-type object-create --queue ${QUEUE} --prefix video/`
    );
  } catch {
    console.log("object-create 通知可能已存在，跳过");
  }

  console.log("\n=== 4. 添加 R2 事件通知 (object-delete, prefix: video/) ===");
  try {
    run(
      `npx wrangler r2 bucket notification create ${BUCKET} --event-type object-delete --queue ${QUEUE} --prefix video/`
    );
  } catch {
    console.log("object-delete 通知可能已存在，跳过");
  }

  console.log("\n=== 完成 ===");
  console.log("- Cron: 每小时整点执行全量同步");
  console.log("- Queue: R2 video/ 下对象创建/删除时实时同步");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
