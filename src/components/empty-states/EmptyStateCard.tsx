import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BenefitItem {
  icon?: LucideIcon;
  title: string;
  description: string;
}

interface EmptyStateCardProps {
  illustration: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
  actionIcon?: LucideIcon;
  onAction: () => void;
  secondaryActionText?: string;
  secondaryActionIcon?: LucideIcon;
  onSecondaryAction?: () => void;
  benefits?: BenefitItem[];
  compact?: boolean;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  illustration,
  title,
  description,
  actionText,
  actionIcon: ActionIcon,
  onAction,
  secondaryActionText,
  secondaryActionIcon: SecondaryActionIcon,
  onSecondaryAction,
  benefits = [],
  compact = false,
}) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors ${compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'}`}>
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
        {/* Ilustración con halo suave */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">{illustration}</div>
        </div>

        {/* Título de alto impacto visual */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>

        {/* Subtítulo explicativo con tips de negocio */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
          {description}
        </p>

        {/* Acciones principales */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4 text-amber-300 dark:text-white" />}
            <span>{actionText}</span>
          </button>

          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              {SecondaryActionIcon && <SecondaryActionIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              <span>{secondaryActionText}</span>
            </button>
          )}
        </div>

        {/* Puntos clave / Beneficios del módulo */}
        {benefits.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800/80 w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {Icon && (
                      <div className="p-1 rounded-lg bg-white dark:bg-slate-700 shadow-2xs text-amber-600 dark:text-amber-400 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
                      {b.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
