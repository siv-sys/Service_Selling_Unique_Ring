import React from 'react';

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  rightElement?: React.ReactNode;
}

export function InputField({ label, type = 'text', placeholder, icon: Icon, rightElement }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
        {rightElement}
      </div>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="size-4 text-slate-400" />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg border border-slate-200 bg-white py-3 pr-4 transition-all
            focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none
            ${Icon ? 'pl-11' : 'pl-4'}
          `}
        />
      </div>
    </div>
  );
}
