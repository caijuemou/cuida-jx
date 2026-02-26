/**
 * 权限管理工具函数
 * 提供统一的权限检查逻辑
 */

/**
 * 用户角色类型定义
 */
export const UserRoles = {
  SUPER_ADMIN: 'super_admin',      // 超级管理员（管理组、蔡珏侔）
  MANAGER: 'manager',              // 店长/店经理
  STAFF: 'staff',                  // 普通员工
  UNKNOWN: 'unknown'               // 未知角色
}

/**
 * 获取用户角色
 * @param {Object} userInfo - 用户信息对象
 * @returns {string} 用户角色
 */
export const getUserRole = (userInfo) => {
  if (!userInfo || !userInfo.name) return UserRoles.UNKNOWN
  
  const { job_title, dept_name, name } = userInfo
  
  // 超级管理员：管理组或特定人员
  if (dept_name?.includes('管理组') || name === '蔡珏侔') {
    return UserRoles.SUPER_ADMIN
  }
  
  // 店长/店经理
  if (job_title?.includes('店长') || job_title?.includes('店经理')) {
    return UserRoles.MANAGER
  }
  
  // 普通员工
  return UserRoles.STAFF
}

/**
 * 检查是否有评分权限
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否有评分权限
 */
export const canAccessScoring = (userInfo) => {
  const role = getUserRole(userInfo)
  return role === UserRoles.SUPER_ADMIN || role === UserRoles.MANAGER
}

/**
 * 检查是否是超级管理员
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否是超级管理员
 */
export const isSuperAdmin = (userInfo) => {
  return getUserRole(userInfo) === UserRoles.SUPER_ADMIN
}

/**
 * 检查是否有管理权限
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否有管理权限
 */
export const canManage = (userInfo) => {
  const role = getUserRole(userInfo)
  return role === UserRoles.SUPER_ADMIN
}

/**
 * 检查是否可以查看所有记录
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否可以查看所有记录
 */
export const canViewAllRecords = (userInfo) => {
  const role = getUserRole(userInfo)
  return role === UserRoles.SUPER_ADMIN || role === UserRoles.MANAGER
}

/**
 * 检查是否可以查看指定部门的记录
 * @param {Object} userInfo - 用户信息对象
 * @param {string} deptName - 部门名称
 * @returns {boolean} 是否可以查看该部门记录
 */
export const canViewDeptRecords = (userInfo, deptName) => {
  const role = getUserRole(userInfo)
  
  if (role === UserRoles.SUPER_ADMIN) return true
  
  if (role === UserRoles.MANAGER) {
    // 店长只能查看自己门店的记录
    return userInfo.dept_name === deptName
  }
  
  // 普通员工只能查看自己的记录
  return false
}

/**
 * 检查是否可以编辑记录
 * @param {Object} userInfo - 当前用户信息
 * @param {Object} record - 记录信息
 * @returns {boolean} 是否可以编辑记录
 */
export const canEditRecord = (userInfo, record) => {
  if (!userInfo || !record) return false
  
  const role = getUserRole(userInfo)
  
  // 超级管理员可以编辑所有记录
  if (role === UserRoles.SUPER_ADMIN) return true
  
  // 店长只能编辑自己发起的记录
  if (role === UserRoles.MANAGER) {
    return userInfo.xft_user_id === record.starter_id
  }
  
  // 普通员工只能编辑自己发起的记录
  return userInfo.xft_user_id === record.starter_id
}

/**
 * 检查是否可以删除记录
 * @param {Object} userInfo - 当前用户信息
 * @param {Object} record - 记录信息
 * @returns {boolean} 是否可以删除记录
 */
export const canDeleteRecord = (userInfo, record) => {
  // 删除权限比编辑更严格，只有超级管理员和记录发起人可以删除
  return canEditRecord(userInfo, record)
}

/**
 * 根据用户角色获取可访问的考核项类型
 * @param {Object} userInfo - 用户信息对象
 * @returns {Array<string>} 可访问的考核项类型 ['staff', 'manager']
 */
export const getAccessibleItemTypes = (userInfo) => {
  const role = getUserRole(userInfo)
  
  switch (role) {
    case UserRoles.SUPER_ADMIN:
      return ['staff', 'manager']
    case UserRoles.MANAGER:
      return ['staff', 'manager']
    case UserRoles.STAFF:
      return ['staff']
    default:
      return []
  }
}

/**
 * 验证用户信息是否有效
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否有效
 */
export const isValidUser = (userInfo) => {
  return !!(userInfo && userInfo.name && (userInfo.xft_user_id || userInfo.staff_seq))
}

/**
 * 获取权限描述信息
 * @param {Object} userInfo - 用户信息对象
 * @returns {Object} 权限描述信息
 */
export const getPermissionInfo = (userInfo) => {
  const role = getUserRole(userInfo)
  
  const roleDescriptions = {
    [UserRoles.SUPER_ADMIN]: {
      label: '超级管理员',
      color: 'bg-purple-100 text-purple-700',
      canScore: true,
      canManage: true,
      canViewAll: true
    },
    [UserRoles.MANAGER]: {
      label: '店长/店经理',
      color: 'bg-rose-100 text-rose-700',
      canScore: true,
      canManage: false,
      canViewAll: true
    },
    [UserRoles.STAFF]: {
      label: '普通员工',
      color: 'bg-emerald-100 text-emerald-700',
      canScore: false,
      canManage: false,
      canViewAll: false
    },
    [UserRoles.UNKNOWN]: {
      label: '未知角色',
      color: 'bg-gray-100 text-gray-700',
      canScore: false,
      canManage: false,
      canViewAll: false
    }
  }
  
  return roleDescriptions[role] || roleDescriptions[UserRoles.UNKNOWN]
}

/**
 * 检查是否是管理组（公司管理组、后勤组、人力组、财务组）
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否是管理组
 */
export const isManagementGroup = (userInfo) => {
  if (!userInfo || !userInfo.dept_name) return false
  const managementKeywords = ['管理组', '后勤', '人力', '财务']
  return managementKeywords.some(keyword => userInfo.dept_name.includes(keyword))
}

/**
 * 检查是否是门店经理（店长、店经理）
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否是门店经理
 */
export const isStoreManager = (userInfo) => {
  if (!userInfo || !userInfo.job_title) return false
  return userInfo.job_title.includes('店长') || userInfo.job_title.includes('店经理')
}

/**
 * 检查是否是受限店长（非公司管理组的店长）
 * @param {Object} userInfo - 用户信息对象
 * @returns {boolean} 是否是受限店长
 */
export const isRestrictedManager = (userInfo) => {
  return isStoreManager(userInfo) && userInfo.dept_name !== '公司管理组'
}

/**
 * 检查用户是否可以查看指定部门的员工数据
 * @param {Object} userInfo - 用户信息对象
 * @param {string} deptName - 部门名称
 * @returns {boolean} 是否可以查看该部门员工数据
 */
export const canViewDeptStaff = (userInfo, deptName) => {
  const role = getUserRole(userInfo)
  if (role === UserRoles.SUPER_ADMIN) return true
  if (role === UserRoles.MANAGER) {
    // 店长只能查看自己门店的员工
    return userInfo.dept_name === deptName
  }
  // 普通员工不能查看其他部门员工
  return false
}