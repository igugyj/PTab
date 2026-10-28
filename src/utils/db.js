const DB_NAME = 'ptab-videos'
const STORE_NAME = 'videos'
const KEY = 'uploaded_video'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveVideo(file) {
  // 直接存 File/Blob：IndexedDB 原生支持，避免先 arrayBuffer() 把大文件
  // 整个读进主线程内存（大视频上传/保存时会明显卡顿）
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ name: file.name, type: file.type, blob: file }, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadVideo() {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(KEY)
    request.onsuccess = () => {
      const result = request.result
      if (!result) return resolve(null)
      // 新格式直接拿 Blob 句柄（不复制进内存）；兼容旧版本存的 { data: ArrayBuffer }
      const blob = result.blob || new Blob([result.data], { type: result.type })
      resolve({ name: result.name, blob })
    }
    request.onerror = () => resolve(null)
  })
}

export async function deleteVideo() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
