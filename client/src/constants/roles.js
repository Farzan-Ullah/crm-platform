export const ROLES = {
  ADMIN: 'ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  SALES_EXECUTIVE: 'SALES_EXECUTIVE',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.SALES_MANAGER]: 'Sales Manager',
  [ROLES.SALES_EXECUTIVE]: 'Sales Executive',
  [ROLES.SUPPORT_AGENT]: 'Support Agent',
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  [ROLES.SALES_MANAGER]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  [ROLES.SALES_EXECUTIVE]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  [ROLES.SUPPORT_AGENT]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};
