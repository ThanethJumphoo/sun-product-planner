import React, { useMemo } from 'react';
import { Edit, CheckCircle2, Ban, Eye } from 'lucide-react';
import { ActionMenu, ActionMenuItem } from '../../../../components/shared/ActionMenu';
import { ChickenYield } from '../types';
import { useChickenYieldsUIStore } from '../stores/ui.store';
import { useUpdateChickenYieldStatus } from '../api/mutations';
import { ChickenYieldStatus } from '../types';

interface ChickenYieldActionMenuProps {
  chickenYield: ChickenYield;
}

export function ChickenYieldActionMenu({ chickenYield }: ChickenYieldActionMenuProps) {
  const { openEditDrawer, openDetailDrawer } = useChickenYieldsUIStore();
  const { mutate: updateStatus } = useUpdateChickenYieldStatus();

  const actions = useMemo<ActionMenuItem<ChickenYield>[]>(() => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye />,
      permission: 'CHICKEN_YIELD.VIEW',
      onClick: (r) => openDetailDrawer(r.id),
    },
    {
      id: 'edit',
      label: 'Edit Yield',
      icon: <Edit />,
      permission: 'CHICKEN_YIELD.EDIT',
      onClick: (r) => openEditDrawer(r.id),
    },
    {
      id: 'status-action',
      label: chickenYield.status === ChickenYieldStatus.ACTIVE ? 'Deactivate' : 'Activate',
      icon: chickenYield.status === ChickenYieldStatus.ACTIVE ? <Ban /> : <CheckCircle2 />,
      permission: 'CHICKEN_YIELD.STATUS_CHANGE',
      danger: chickenYield.status === ChickenYieldStatus.ACTIVE,
      divider: true,
      onClick: (r) => {
        const isDeactivating = r.status === ChickenYieldStatus.ACTIVE;
        const confirmMsg = isDeactivating ? 'deactivate' : 'activate';
        const targetStatus = isDeactivating ? ChickenYieldStatus.INACTIVE : ChickenYieldStatus.ACTIVE;

        if (confirm(`Are you sure you want to ${confirmMsg} this yield record?`)) {
          updateStatus({ id: r.id, status: targetStatus });
        }
      },
    },
  ], [openDetailDrawer, openEditDrawer, updateStatus, chickenYield.status]);

  return <ActionMenu data={chickenYield} actions={actions} />;
}
