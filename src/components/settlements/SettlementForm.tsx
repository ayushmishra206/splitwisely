import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { GroupWithMembers } from '../../services/groups';

export const settlementSchema = z
  .object({
    groupId: z.string().min(1, 'Select a group'),
    fromMemberId: z.string().min(1, 'Select who paid'),
    toMemberId: z.string().min(1, 'Select who was paid'),
    amount: z
      .string()
      .min(1, 'Enter an amount')
      .refine((value) => Number.isFinite(Number.parseFloat(value)) && Number.parseFloat(value) > 0, {
        message: 'Enter a positive amount'
      }),
    settlementDate: z.string().min(1, 'Pick a date'),
    notes: z
      .string()
      .max(240, 'Keep notes under 240 characters')
      .optional()
      .or(z.literal(''))
  })
  .refine((values) => values.fromMemberId !== values.toMemberId, {
    message: 'Members must be different',
    path: ['toMemberId']
  });

export type SettlementFormValues = z.infer<typeof settlementSchema>;

interface SettlementFormProps {
  groups: GroupWithMembers[];
  onSubmit: (values: SettlementFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<SettlementFormValues>;
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

export const SettlementForm = ({
  groups,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save settlement',
  defaultValues
}: SettlementFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitSuccessful },
    reset
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      groupId: defaultValues?.groupId ?? (groups[0]?.id ?? ''),
      fromMemberId: defaultValues?.fromMemberId ?? '',
      toMemberId: defaultValues?.toMemberId ?? '',
      amount: defaultValues?.amount ?? '',
      settlementDate: defaultValues?.settlementDate ?? defaultDate(),
      notes: defaultValues?.notes ?? ''
    }
  });

  const activeGroupId = watch('groupId');
  const fromMemberId = watch('fromMemberId');
  const toMemberId = watch('toMemberId');

  useEffect(() => {
    if (!groups.length) {
      return;
    }
    if (!activeGroupId) {
      setValue('groupId', groups[0]?.id ?? '');
    }
  }, [groups, activeGroupId, setValue]);

  const activeGroupMembers = useMemo(() => {
    const group = groups.find((candidate) => candidate.id === activeGroupId);
    return group?.group_members ?? [];
  }, [groups, activeGroupId]);

  useEffect(() => {
    if (!isSubmitSuccessful) {
      return;
    }
    reset({
      groupId: defaultValues?.groupId ?? (groups[0]?.id ?? ''),
      fromMemberId: '',
      toMemberId: '',
      amount: '',
      settlementDate: defaultValues?.settlementDate ?? defaultDate(),
      notes: defaultValues?.notes ?? ''
    });
  }, [isSubmitSuccessful, reset, defaultValues, groups]);

  useEffect(() => {
    if (!activeGroupMembers.length) {
      setValue('fromMemberId', '');
      setValue('toMemberId', '');
      return;
    }

    if (!activeGroupMembers.some((member) => member.member_id === fromMemberId)) {
      setValue('fromMemberId', activeGroupMembers[0]?.member_id ?? '');
    }

    const nonMatchingMembers = activeGroupMembers.filter((member) => member.member_id !== fromMemberId);
    if (!nonMatchingMembers.some((member) => member.member_id === toMemberId)) {
      setValue('toMemberId', nonMatchingMembers[0]?.member_id ?? '');
    }
  }, [activeGroupMembers, fromMemberId, toMemberId, setValue]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="settlement-group">
          Group
        </label>
        <select
          id="settlement-group"
          {...register('groupId')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {errors.groupId ? <p className="text-sm text-rose-500">{errors.groupId.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="settlement-from">
            Paid by
          </label>
          <select
            id="settlement-from"
            {...register('fromMemberId')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {activeGroupMembers.map((member) => (
              <option key={member.member_id} value={member.member_id}>
                {member.profiles?.full_name ?? 'Member'}
              </option>
            ))}
          </select>
          {errors.fromMemberId ? <p className="text-sm text-rose-500">{errors.fromMemberId.message}</p> : null}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="settlement-to">
            Received by
          </label>
          <select
            id="settlement-to"
            {...register('toMemberId')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {activeGroupMembers
              .filter((member) => member.member_id !== fromMemberId)
              .map((member) => (
                <option key={member.member_id} value={member.member_id}>
                  {member.profiles?.full_name ?? 'Member'}
                </option>
              ))}
          </select>
          {errors.toMemberId ? <p className="text-sm text-rose-500">{errors.toMemberId.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="settlement-amount">
            Amount
          </label>
          <input
            id="settlement-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register('amount')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.amount ? <p className="text-sm text-rose-500">{errors.amount.message}</p> : null}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="settlement-date">
            Date
          </label>
          <input
            id="settlement-date"
            type="date"
            {...register('settlementDate')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.settlementDate ? <p className="text-sm text-rose-500">{errors.settlementDate.message}</p> : null}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="settlement-notes">
          Notes <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="settlement-notes"
          rows={3}
          {...register('notes')}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Transferred via bank app"
        />
        {errors.notes ? <p className="text-sm text-rose-500">{errors.notes.message}</p> : null}
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
