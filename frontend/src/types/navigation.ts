import { ReactNode } from 'react';

export type NavItem = {
  label: string;
  icon?: ReactNode;
  href: string;
  permission?: string;
  children?: NavItem[];
};
