import React from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { useChickenYieldsUIStore } from '../stores/ui.store';
import { ChickenYieldForm } from '../forms/ChickenYieldForm';
import { useChickenYield } from '../api/queries';
import { useUpdateChickenYield } from '../api/mutations';
import { ChickenYieldFormValues } from '../schemas';

export function EditChickenYieldDrawer() {
  const { isEditDrawerOpen, closeEditDrawer, selectedChickenYieldId } = useChickenYieldsUIStore();
  
  const { data: chickenYield, isLoading: isFetching } = useChickenYield(selectedChickenYieldId!, {
    enabled: isEditDrawerOpen && !!selectedChickenYieldId,
  });
  
  const { mutate: updateChickenYield, isPending } = useUpdateChickenYield();

  const handleSubmit = (values: ChickenYieldFormValues) => {
    if (!selectedChickenYieldId) return;
    updateChickenYield(
      { id: selectedChickenYieldId, data: values },
      {
        onSuccess: () => {
          closeEditDrawer();
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || 'Failed to update yield record';
          alert(msg);
        }
      }
    );
  };

  return (
    <Drawer
      open={isEditDrawerOpen}
      onClose={closeEditDrawer}
      title="Edit Chicken Yield"
      size="md"
    >
      <div className="p-6">
        {isFetching ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : chickenYield ? (
          <ChickenYieldForm
            isEdit
            initialValues={{
              partCode: chickenYield.partCode,
              partName: chickenYield.partName,
              yieldPercent: Number(chickenYield.yieldPercent),
              sortOrder: chickenYield.sortOrder,
              status: chickenYield.status as any,
            }}
            onSubmit={handleSubmit}
            isLoading={isPending}
          />
        ) : (
          <div className="text-danger">Failed to load record details.</div>
        )}
      </div>
    </Drawer>
  );
}
