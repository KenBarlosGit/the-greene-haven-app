import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastState } from '../hooks/useToast';
import { cn } from '../lib/cn';

interface Props {
  toast: ToastState | null;
  onDismiss: () => void;
}

const VARIANT = {
  warning: {
    Icon: AlertTriangle,
    border: 'border-amber-300',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  info: {
    Icon: Info,
    border: 'border-brand-200',
    iconBg: 'bg-brand-100 text-brand-700',
  },
  success: {
    Icon: CheckCircle2,
    border: 'border-brand-300',
    iconBg: 'bg-brand-100 text-brand-700',
  },
} as const;

const Toast = ({ toast, onDismiss }: Props) => {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none w-[min(92vw,28rem)]"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'transition-all duration-300 ease-out',
          toast
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-3',
        )}
      >
        {toast && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-xl bg-white border shadow-lg shadow-brand-900/10 px-4 py-3',
              VARIANT[toast.variant].border,
            )}
            key={toast.id}
          >
            <span
              className={cn(
                'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                VARIANT[toast.variant].iconBg,
              )}
            >
              {(() => {
                const Icon = VARIANT[toast.variant].Icon;
                return <Icon size={16} />;
              })()}
            </span>
            <p className="flex-1 text-sm text-zinc-800 pt-1.5">{toast.message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 p-1.5 -m-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
