import { Calendar, Clock, Check } from 'lucide-react';
import type { DateRange, FormStep } from '../types/booking';
import { cn } from '../lib/cn';
import { formatRange, nightsBetween } from '../lib/date';
import { calculateTotal, formatCurrency, formatRate } from '../lib/pricing';

interface Props {
  currentStep: FormStep;
  selectedRange: DateRange | null;
}

const STEPS = [
  { id: 1, title: 'Select dates', subtitle: 'Pick when you want to visit', Icon: Calendar },
  { id: 2, title: 'Your details', subtitle: 'Time, guests, and any notes', Icon: Clock },
  { id: 3, title: 'Confirm', subtitle: 'Review and finalise your booking', Icon: Check },
] as const;

const StepIndicator = ({ currentStep, selectedRange }: Props) => {
  const nights = selectedRange ? nightsBetween(selectedRange.start, selectedRange.end) : 0;
  return (
    <aside className="flex-shrink-0 w-full lg:max-w-[300px] rounded-2xl bg-white border border-zinc-200 p-6 flex flex-col overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-50 to-transparent pointer-events-none" aria-hidden />
      <div className="mb-7 relative">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-700/80">Booking</p>
        <h2 className="font-display text-2xl tracking-wide text-brand-900 mt-1">
          Reserve your stay
        </h2>
        <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
          A quiet, sustainable retreat. Three small steps and you’re booked.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 border border-brand-100">
          {formatRate()}
        </div>
      </div>

      <ol className="flex flex-col">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;
          const isLast = idx === STEPS.length - 1;
          const StepIcon = step.Icon;

          return (
            <li key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors',
                    isComplete && 'bg-gradient-to-br from-brand-600 to-brand-900 border-brand-800 text-white shadow-sm shadow-brand-900/20',
                    isActive && !isComplete && 'bg-gradient-to-br from-brand-600 to-brand-900 border-brand-800 text-white shadow-sm shadow-brand-900/20',
                    !isActive && !isComplete && 'bg-white border-zinc-200 text-zinc-400',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isComplete ? <Check size={16} /> : <StepIcon size={16} />}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-px flex-1 min-h-10 my-1',
                      isComplete ? 'bg-brand-700' : 'bg-zinc-200',
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <div className="pt-1 pb-6">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                  Step {step.id}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isActive || isComplete ? 'text-brand-900' : 'text-zinc-500',
                  )}
                >
                  {step.title}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">{step.subtitle}</p>
                {step.id === 1 && selectedRange && (
                  <p className="text-brand-800 text-xs font-medium mt-1.5">
                    {formatRange(selectedRange.start, selectedRange.end)}
                    {nights > 0 && (
                      <span className="text-zinc-500 font-normal">
                        {' '}· {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                    )}
                    <span className="block text-brand-700 mt-0.5 tabular-nums">
                      {formatCurrency(calculateTotal(nights))}
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
};

export default StepIndicator;
