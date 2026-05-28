/**
 * 前人树 - 数据预处理脚本
 * 将 raw-data/ 下的原始文档复制、提取文本、构建索引，输出到 resources/
 *
 * 执行：npm run prepare-data
 */

const fs = require('fs')
const path = require('path')

const RESOURCES_DIR = path.join(__dirname, '..', 'resources')
const RAW_DATA_DIR = path.join(__dirname, '..', 'raw-data')

function main() {
  console.log('=== 前人树 数据预处理 ===')

  // Step 1: Clean output directories
  console.log('[1/4] 清理输出目录...')
  const docsDir = path.join(RESOURCES_DIR, 'documents')
  const distDir = path.join(RESOURCES_DIR, 'dist-data')
  if (fs.existsSync(docsDir)) fs.rmSync(docsDir, { recursive: true })
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true })
  fs.mkdirSync(docsDir, { recursive: true })
  fs.mkdirSync(distDir, { recursive: true })

  // Step 2: Copy raw documents
  console.log('[2/4] 复制原始文档...')
  copyDir(RAW_DATA_DIR, docsDir)

  // Step 3: Extract text and build FTS index
  console.log('[3/4] 提取文本并建立全文索引...')
  // TODO: Implement in later phase

  // Step 4: Process theory knowledge chunks + vector index
  console.log('[4/4] 处理理论知识切片与向量索引...')
  // TODO: Implement in later phase

  console.log('=== 预处理完成 ===')
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

main()
