import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Keep the name under 80 characters'),
  description: z
    .string()
    .max(240, 'Descriptions should be under 240 characters')
    .optional()
    .or(z.literal('')),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(4, 'Use ISO codes like USD, EUR, etc.')
});

export type GroupFormValues = z.infer<typeof groupSchema>;

interface GroupFormProps {
  defaultValues?: Partial<GroupFormValues>;
  onSubmit: (values: GroupFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

export const GroupForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save group',
  isSubmitting = false
}: GroupFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful }
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'USD',
      ...defaultValues
    }
  });

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset({
        name: '',
        description: '',
        currency: defaultValues?.currency ?? 'USD'
      });
    }
  }, [isSubmitSuccessful, reset, defaultValues?.currency]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="group-name">
          Group name
        </label>
        <input
          id="group-name"
          type="text"
          autoComplete="off"
          {...register('name')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Weekend getaway" 
        />
        {errors.name && <p className="text-sm text-rose-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="group-description">
          Description <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="group-description"
          rows={3}
          {...register('description')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Friends trip 2025"
        />
        {errors.description && <p className="text-sm text-rose-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="group-currency">
          Default currency
        </label>
        <select
          id="group-currency"
          {...register('currency')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {currencyOptions.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        {errors.currency && <p className="text-sm text-rose-500">{errors.currency.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
