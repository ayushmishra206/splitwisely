import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { GroupWithMembers } from '../../services/groups';

const expenseSchema = z.object({
  groupId: z.string().min(1, 'Select the group this expense belongs to'),
  description: z
    .string()
    .min(1, 'Give this expense a short description')
    .max(120, 'Descriptions should stay under 120 characters'),
  amount: z
    .string()
    .min(1, 'Enter how much was spent')
    .refine((value) => {
      const parsed = Number.parseFloat(value);
      return !Number.isNaN(parsed) && parsed > 0;
    }, 'Use a positive amount'),
  payerId: z.string().min(1, 'Pick who paid'),
  participantIds: z.array(z.string()).min(1, 'Select at least one participant'),
  expenseDate: z.string().min(1, 'Choose when this expense happened'),
  notes: z
    .string()
    .max(240, 'Keep notes under 240 characters')
    .optional()
    .or(z.literal(''))
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  groups: GroupWithMembers[];
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const ExpenseForm = ({
  groups,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save expense',
  isSubmitting = false
}: ExpenseFormProps) => {
  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        id: group.id,
        name: group.name,
        currency: group.currency,
        members: group.group_members ?? []
      })),
    [groups]
  );

  const defaultValuesKey = useMemo(() => JSON.stringify(defaultValues ?? {}), [defaultValues]);
  const previousGroupCount = useRef(0);
  const previousDefaultsKey = useRef<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      groupId: groupOptions[0]?.id ?? '',
      description: '',
      amount: '',
      payerId: groupOptions[0]?.members?.[0]?.member_id ?? '',
      participantIds: groupOptions[0]?.members?.map((member) => member.member_id) ?? [],
      expenseDate: new Date().toISOString().slice(0, 10),
      notes: '',
      ...defaultValues
    }
  });

  const selectedGroupId = watch('groupId');
  const selectedGroup = useMemo(() => groupOptions.find((group) => group.id === selectedGroupId) ?? null, [groupOptions, selectedGroupId]);
  const participantIds = watch('participantIds');
  const payerId = watch('payerId');

  useEffect(() => {
    if (!groupOptions.length) {
      previousGroupCount.current = 0;
      return;
    }

    const groupsChanged = previousGroupCount.current !== groupOptions.length;
    const defaultsChanged = previousDefaultsKey.current !== defaultValuesKey;

    if (!groupsChanged && !defaultsChanged) {
      return;
    }

    previousGroupCount.current = groupOptions.length;
    previousDefaultsKey.current = defaultValuesKey;

    const fallbackGroupId = defaultValues?.groupId ?? groupOptions[0]?.id ?? '';
    const fallbackGroup = groupOptions.find((group) => group.id === fallbackGroupId) ?? groupOptions[0];
    const fallbackMembers = fallbackGroup.members;

    reset({
      groupId: fallbackGroupId,
      description: defaultValues?.description ?? '',
      amount: defaultValues?.amount ?? '',
      payerId: defaultValues?.payerId ?? fallbackMembers[0]?.member_id ?? '',
      participantIds: defaultValues?.participantIds ?? fallbackMembers.map((member) => member.member_id),
      expenseDate: defaultValues?.expenseDate ?? new Date().toISOString().slice(0, 10),
      notes: defaultValues?.notes ?? ''
    });
  }, [defaultValues, defaultValuesKey, groupOptions, reset]);

  useEffect(() => {
    if (!groupOptions.length || selectedGroupId) {
      return;
    }

    const firstGroup = groupOptions[0];
    setValue('groupId', firstGroup.id);
    setValue('participantIds', firstGroup.members.map((member) => member.member_id));
    setValue('payerId', firstGroup.members[0]?.member_id ?? '');
  }, [groupOptions, selectedGroupId, setValue]);

  useEffect(() => {
    if (!selectedGroup) {
      setValue('participantIds', []);
      setValue('payerId', '');
      return;
    }

    const memberIds = selectedGroup.members.map((member) => member.member_id);
    if (memberIds.length && !memberIds.includes(payerId)) {
      setValue('payerId', memberIds[0]);
    }

    if (!participantIds.length) {
      setValue('participantIds', memberIds);
      return;
    }

    const filtered = participantIds.filter((id) => memberIds.includes(id));
    if (filtered.length !== participantIds.length) {
      setValue('participantIds', filtered);
    }
  }, [selectedGroup, setValue, participantIds, payerId]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="expense-group">
            Group
          </label>
          <select
            id="expense-group"
            {...register('groupId')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select a group</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {errors.groupId && <p className="text-sm text-rose-500">{errors.groupId.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="expense-date">
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            {...register('expenseDate')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.expenseDate && <p className="text-sm text-rose-500">{errors.expenseDate.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="expense-description">
          Description
        </label>
        <input
          id="expense-description"
          type="text"
          {...register('description')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Dinner at the cafe"
        />
        {errors.description && <p className="text-sm text-rose-500">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="expense-amount">
            Amount
          </label>
          <input
            id="expense-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            {...register('amount')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="0.00"
          />
          {errors.amount && <p className="text-sm text-rose-500">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="expense-payer">
            Who paid?
          </label>
          <select
            id="expense-payer"
            {...register('payerId')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            disabled={!selectedGroup || selectedGroup.members.length === 0}
          >
            <option value="">Select member</option>
            {selectedGroup?.members.map((member) => (
              <option key={member.member_id} value={member.member_id}>
                {member.profiles?.full_name ?? 'Member'}
              </option>
            ))}
          </select>
          {errors.payerId && <p className="text-sm text-rose-500">{errors.payerId.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Participants</p>
        {selectedGroup ? (
          selectedGroup.members.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedGroup.members.map((member) => {
                const label = member.profiles?.full_name ?? 'Member';
                const value = member.member_id;
                return (
                  <label
                    key={value}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <input
                      type="checkbox"
                      value={value}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      {...register('participantIds')}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
              Add members to this group before splitting expenses.
            </p>
          )
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
            Choose a group to pick members.
          </p>
        )}
        {errors.participantIds && <p className="text-sm text-rose-500">{errors.participantIds.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="expense-notes">
          Notes <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="expense-notes"
          rows={3}
          {...register('notes')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Add context so everyone stays aligned"
        />
        {errors.notes && <p className="text-sm text-rose-500">{errors.notes.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
            disabled={isSubmitting}
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
