import React from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { useChickenYieldsUIStore } from '../stores/ui.store';
import { ChickenYieldForm } from '../forms/ChickenYieldForm';
import { useCreateChickenYield } from '../api/mutations';
import { ChickenYieldFormValues } from '../schemas';

export function CreateChickenYieldDrawer() {
  const { isCreateDrawerOpen, closeCreateDrawer } = useChickenYieldsUIStore();
  const { mutate: createChickenYield, isPending } = useCreateChickenYield();

  const handleSubmit = (values: ChickenYieldFormValues) => {
    createChickenYield(values, {
      onSuccess: () => {
        closeCreateDrawer();
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || 'Failed to create yield record';
        alert(msg); // Will be replaced by proper toast later
      }
    });
  };

  return (
    <Drawer
      open={isCreateDrawerOpen}
      onClose={closeCreateDrawer}
      title="Create Chicken Yield"
      size="md"
    >
      <div className="p-6">
        <ChickenYieldForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </Drawer>
  );
}
