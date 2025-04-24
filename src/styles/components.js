// Common component styles that can be reused throughout the application

export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus-visible:ring-secondary-500',
    outline: 'border border-secondary-200 bg-transparent hover:bg-secondary-100 focus-visible:ring-secondary-500',
    ghost: 'bg-transparent hover:bg-secondary-100 focus-visible:ring-secondary-500',
    link: 'bg-transparent underline-offset-4 hover:underline focus-visible:ring-secondary-500',
  },
  sizes: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  },
};

export const inputStyles = {
  base: 'flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  error: 'border-error-500 focus-visible:ring-error-500',
};

export const modalStyles = {
  overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
  container: 'fixed inset-0 z-50 flex items-center justify-center p-4',
  content: 'relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg animate-scale-in',
  header: 'flex items-center justify-between space-y-0 pb-4',
  title: 'text-xl font-semibold text-secondary-900',
  description: 'text-sm text-secondary-500',
  footer: 'flex items-center justify-end space-x-2 pt-4',
};

export const cardStyles = {
  base: 'rounded-lg border border-secondary-200 bg-white shadow-sm',
  header: 'flex flex-col space-y-1.5 p-6',
  title: 'text-xl font-semibold text-secondary-900',
  description: 'text-sm text-secondary-500',
  content: 'p-6 pt-0',
  footer: 'flex items-center p-6 pt-0',
};

export const badgeStyles = {
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    default: 'bg-secondary-100 text-secondary-900',
    primary: 'bg-primary-100 text-primary-900',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  },
};

export const alertStyles = {
  base: 'relative w-full rounded-lg border p-4',
  variants: {
    default: 'bg-white text-secondary-900 border-secondary-200',
    primary: 'bg-primary-50 text-primary-900 border-primary-200',
    success: 'bg-success-50 text-success-600 border-success-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    error: 'bg-error-50 text-error-600 border-error-200',
  },
  title: 'mb-1 font-medium',
  description: 'text-sm [&_p]:leading-relaxed',
};

export const tableStyles = {
  wrapper: 'w-full overflow-auto',
  table: 'w-full caption-bottom text-sm',
  header: 'border-b border-secondary-200',
  headerCell: 'h-12 px-4 text-left align-middle font-medium text-secondary-500',
  body: 'divide-y divide-secondary-200',
  row: 'hover:bg-secondary-50/50',
  cell: 'p-4 align-middle',
};

export const formStyles = {
  label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  error: 'text-sm text-error-500',
  helper: 'text-sm text-secondary-500',
  group: 'space-y-2',
}; 