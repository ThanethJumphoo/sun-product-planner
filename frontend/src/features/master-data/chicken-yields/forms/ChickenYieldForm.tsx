import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chickenYieldSchema, ChickenYieldFormValues } from '../schemas';
import { ChickenYieldStatus } from '../types';

interface ChickenYieldFormProps {
  initialValues?: Partial<ChickenYieldFormValues>;
  onSubmit: (values: ChickenYieldFormValues) => void;
  isLoading?: boolean;
  isEdit?: boolean;
  readOnly?: boolean;
}

export function ChickenYieldForm({
  initialValues,
  onSubmit,
  isLoading,
  isEdit,
  readOnly,
}: ChickenYieldFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(chickenYieldSchema),
    defaultValues: {
      partCode: '',
      partName: '',
      yieldPercent: 0,
      sortOrder: 0,
      status: ChickenYieldStatus.ACTIVE,
      ...initialValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Part Code */}
        <div>
          <label className="block text-sm font-medium text-foreground">Part Code *</label>
          <input
            {...register('partCode')}
            disabled={isEdit || readOnly}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            placeholder="e.g. FILLET"
          />
          {errors.partCode && <p className="mt-1 text-sm text-danger">{errors.partCode.message as string}</p>}
        </div>

        {/* Part Name */}
        <div>
          <label className="block text-sm font-medium text-foreground">Part Name *</label>
          <input
            {...register('partName')}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            placeholder="e.g. Fillet"
          />
          {errors.partName && <p className="mt-1 text-sm text-danger">{errors.partName.message as string}</p>}
        </div>

        {/* Yield Percent */}
        <div>
          <label className="block text-sm font-medium text-foreground">Yield % *</label>
          <div className="relative mt-1">
            <input
              {...register('yieldPercent', { valueAsNumber: true })}
              type="number"
              step="0.01"
              disabled={readOnly}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm disabled:opacity-50"
              placeholder="e.g. 24.00"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground pointer-events-none">
              %
            </span>
          </div>
          {errors.yieldPercent && <p className="mt-1 text-sm text-danger">{errors.yieldPercent.message as string}</p>}
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-foreground">Sort Order</label>
          <input
            {...register('sortOrder', { valueAsNumber: true })}
            type="number"
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            placeholder="e.g. 1"
          />
          {errors.sortOrder && <p className="mt-1 text-sm text-danger">{errors.sortOrder.message as string}</p>}
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground">Status</label>
          <select
            {...register('status')}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value={ChickenYieldStatus.ACTIVE}>Active</option>
            <option value={ChickenYieldStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Yield' : 'Create Yield'}
          </button>
        </div>
      )}
    </form>
  );
}
