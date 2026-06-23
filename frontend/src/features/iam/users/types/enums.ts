export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LOCKED: 'LOCKED',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

export const AuthProvider = {
  LOCAL: 'LOCAL',
  AD: 'AD',
  SAML: 'SAML',
  OIDC: 'OIDC',
} as const;

export type AuthProviderType = typeof AuthProvider[keyof typeof AuthProvider];

export const ScopeType = {
  PLANT: 'PLANT',
  WAREHOUSE: 'WAREHOUSE',
  LINE: 'LINE',
  BUSINESS_UNIT: 'BUSINESS_UNIT',
  COST_CENTER: 'COST_CENTER',
} as const;

export type ScopeTypeType = typeof ScopeType[keyof typeof ScopeType];
