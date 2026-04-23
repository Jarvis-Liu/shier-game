import fs from 'node:fs'
import path from 'node:path'

// 数据存储路径：优先使用环境变量，回退到当前工作目录
const dataDir = process.env.DATA_DIR || process.cwd()
const filePath = path.resolve(dataDir, 'data.json')

export interface AppData {
  users: Record<string, string> // userId -> nickname
  leaderboard: {
    dateStr: string // 北京时间的 YYYY-MM-DD
    records: Record<string, number> // userId -> winCount
  }
}

const defaultData: AppData = {
  users: {},
  leaderboard: {
    dateStr: '',
    records: {}
  }
}

// 在内存中保留一份引用
let memoryData: AppData | null = null

/**
 * 生成默认数据的深拷贝，避免引用污染
 */
function cloneDefaultData(): AppData {
  return JSON.parse(JSON.stringify(defaultData))
}

export function loadData(): AppData {
  if (memoryData) return memoryData

  try {
    if (!fs.existsSync(filePath)) {
      const fresh = cloneDefaultData()
      saveData(fresh)
      memoryData = fresh
      return memoryData
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    memoryData = JSON.parse(raw) as AppData
    return memoryData
  } catch (err) {
    console.error('Failed to load data.json', err)
    memoryData = cloneDefaultData()
    return memoryData
  }
}

export function saveData(data: AppData) {
  try {
    memoryData = data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save data.json', err)
  }
}
