import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-4 w-4 text-slate-400" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`block w-full rounded-lg border text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-900 ${
              Icon ? 'pl-9' : 'pl-3.5'
            } pr-3.5 py-2.5 ${
              error
                ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-300'
                : 'border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
