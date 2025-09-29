import { useCallback, useMemo, useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiArrowRight, FiCheckCircle, FiLogIn, FiMail, FiShield } from 'react-icons/fi';
import { useSupabase } from '../../providers/SupabaseProvider';

interface AuthViewProps {
  onAuthenticated?: () => void;
}

type AuthMode = 'signIn' | 'signUp';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Share at least 2 characters').max(60, 'Name is too long')
});

type AuthFormValues = {
  email: string;
  password: string;
  fullName?: string;
};

export const AuthView = ({ onAuthenticated }: AuthViewProps) => {
  const { supabase } = useSupabase();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolver = useMemo<Resolver<AuthFormValues>>(
    () => zodResolver(mode === 'signIn' ? signInSchema : signUpSchema) as Resolver<AuthFormValues>,
    [mode]
  );

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthFormValues>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
      fullName: ''
    }
  });

  const toggleMode = useCallback(() => {
    setMode((value) => (value === 'signIn' ? 'signUp' : 'signIn'));
    setStatus(null);
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });

        if (error) {
          throw error;
        }

        setStatus({ type: 'success', message: 'Welcome back! Redirecting…' });
        onAuthenticated?.();
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: 'fullName' in values ? values.fullName : undefined
            }
          }
        });

        if (error) {
          throw error;
        }

        setStatus({
          type: 'success',
          message: 'Check your inbox to confirm your account, then sign in.'
        });
        setMode('signIn');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white/60 p-10 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
          <FiShield className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          {mode === 'signIn' ? 'Welcome back' : 'Create your SplitWisely account'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {mode === 'signIn'
            ? 'Sign in to manage your groups, expenses, and settlements.'
            : 'Sign up to start tracking shared expenses the smart way.'}
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        {status ? (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200'
            }`}
          >
            {status.type === 'success' ? <FiCheckCircle className="mt-0.5 h-4 w-4" /> : <FiMail className="mt-0.5 h-4 w-4" />}
            <p>{status.message}</p>
          </div>
        ) : null}

        {mode === 'signUp' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              {...register('fullName')}
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Ada Lovelace"
            />
            {errors.fullName ? <p className="text-sm text-rose-500">{errors.fullName.message}</p> : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="you@example.com"
          />
          {errors.email ? <p className="text-sm text-rose-500">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            {...register('password')}
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="••••••••"
          />
          {errors.password ? <p className="text-sm text-rose-500">{errors.password.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
          <FiArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-300">
        {mode === 'signIn' ? (
          <p>
            New here?{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Create an account
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Sign in instead
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
