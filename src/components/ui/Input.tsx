import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const base = 'w-full bg-well border border-firm rounded-lg px-3 py-2 text-sm text-strong placeholder-soft focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-soft mb-1">{label}</label>
      )}
      <input id={id} className={`${base} ${className}`} {...props} />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, id, className = '', children, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-soft mb-1">{label}</label>
      )}
      <select id={id} className={`${base} bg-well ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-soft mb-1">{label}</label>
      )}
      <textarea id={id} className={`${base} resize-none ${className}`} {...props} />
    </div>
  );
}
