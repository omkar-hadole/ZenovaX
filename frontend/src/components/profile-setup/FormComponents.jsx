export const FieldGroup = ({ label, required, children, description }) => (
    <label className="space-y-1.5 block">
        <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#294F6B' }}>{label}</span>
            {required && (
                <span className="text-[9px] text-text-subtle font-medium">*</span>
            )}
        </div>
        {description && <p className="text-xs text-text-muted">{description}</p>}
        {children}
    </label>
);

export const Chip = ({ label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3.5 py-1.5 rounded-[14px] text-sm font-medium transition-all duration-200 ${
            active
                ? 'text-white border-transparent'
                : 'text-[#183B55] hover:border-[#4A9FE5]'
        }`}
        style={active
            ? { background: '#287FC4' }
            : {
                background: 'rgba(255,255,255,0.58)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(42,105,155,0.08)',
            }
        }
    >
        {label}
    </button>
);

export const RoleOption = ({ label, description, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-start gap-2 rounded-2xl border px-6 py-5 text-left transition-all ${
            selected
                ? 'border-border-accent bg-accent-tint shadow-sm'
                : 'border-border bg-surface hover:border-border-accent hover:bg-surface-2'
        }`}
    >
        <p className={`font-bold text-lg ${selected ? 'text-text' : 'text-text'}`}>{label}</p>
        <p className="text-sm text-text-muted">{description}</p>
    </button>
);
