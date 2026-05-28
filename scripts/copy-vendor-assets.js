/**
 * 前人树 - 离线资源复制脚本
 * 将第三方库的静态资源复制到 public/ 目录，确保完全离线可用。
 * 执行：npm run copy-assets
 *
 * 对应 PRD 第 8 节 — 本地化资源准备
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const tasks = [
  {
    name: 'Vditor',
    src: path.join(ROOT, 'node_modules', 'vditor', 'dist'),
    // Vditor 内部用 ${cdn}/dist/js/... 拼接路径，所以必须嵌套在 dist/ 子目录下
    dest: path.join(PUBLIC, 'vditor', 'dist'),
    items: ['css', 'js', 'images', 'index.css', 'index.js', 'index.min.js', 'method.js', 'method.min.js']
  },
  {
    name: 'PDF.js',
    src: path.join(ROOT, 'node_modules', 'pdfjs-dist'),
    dest: path.join(PUBLIC, 'pdfjs'),
    items: [
      'build/pdf.min.mjs',
      'build/pdf.worker.min.mjs',
      'build/pdf.sandbox.min.mjs',
      'cmaps'
    ]
  }
]

function copyItem(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyItem(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

function main() {
  console.log('=== 前人树 离线资源复制 ===\n')

  // Clean and recreate public dir
  if (fs.existsSync(PUBLIC)) {
    fs.rmSync(PUBLIC, { recursive: true })
  }
  fs.mkdirSync(PUBLIC, { recursive: true })

  for (const task of tasks) {
    console.log(`[${task.name}] 复制资源到 ${path.relative(ROOT, task.dest)}/ ...`)

    if (!fs.existsSync(task.src)) {
      console.warn(`  警告: 源目录不存在 ${task.src}，跳过`)
      continue
    }

    for (const item of task.items) {
      const srcPath = path.join(task.src, item)
      const destPath = path.join(task.dest, item)
      if (fs.existsSync(srcPath)) {
        copyItem(srcPath, destPath)
        console.log(`  ${item}`)
      } else {
        console.warn(`  警告: ${item} 不存在，跳过`)
      }
    }
  }

  console.log('\n=== 复制完成 ===')
}

main()
