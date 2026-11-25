// 绩效记录（perf_records）的公共处理逻辑
//
// 背景：记录先以 sync_status='pending' 落库，再去调薪福通，成功后回写 'sent'+流程号。
//   如果这一步中途被打断（刷新页面、网络断开、invoke 卡住），记录就会永远停在 pending，
//   在历史列表里显示成「处理中...」，实际是垃圾数据（往往是用户重复提交留下的）。
//   正常同步在几秒内完成，超过阈值还停在 pending 的，必然是断掉了。

// 判定「卡住」的阈值（分钟）
export const STALE_PENDING_MINUTES = 5

/**
 * 是否是卡住的 pending 记录
 * @param {Object} record perf_records 的一行（需含 sync_status、created_at）
 * @param {number} [now] 当前时间戳，便于测试
 */
export const isStalePending = (record, now = Date.now()) => {
  if (!record || record.sync_status !== 'pending') return false
  if (!record.created_at) return false
  const created = new Date(record.created_at).getTime()
  if (!created || Number.isNaN(created)) return false
  return now - created > STALE_PENDING_MINUTES * 60 * 1000
}

/**
 * 过滤出应该展示的记录：剔除卡住的 pending
 * 刚提交、正在同步中的记录（几分钟内）仍然正常展示，不影响「处理中...」的正常体验
 */
export const filterVisibleRecords = (rows, now = Date.now()) =>
  (rows || []).filter((r) => !isStalePending(r, now))
