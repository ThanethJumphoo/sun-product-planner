export const RoleStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type RoleStatusType = typeof RoleStatus[keyof typeof RoleStatus];
