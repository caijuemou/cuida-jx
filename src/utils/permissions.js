export const canAccessScoring = (userInfo) => {
  const { job_title, dept_name } = userInfo;
  return job_title?.includes('店经理') || dept_name?.includes('管理组');
};

export const isSuperAdmin = (userInfo) => {
  const { name, dept_name } = userInfo;
  return dept_name?.includes('管理组') || name === '蔡珏侔';
};

export const checkAccess = (userInfo, route) => {
  const { job_title, dept_name } = userInfo;
  const requiresScoring = route.meta.requiresScoring;
  
  if (requiresScoring) {
    return job_title?.includes('店经理') || dept_name?.includes('管理组');
  }
  
  return true;
};