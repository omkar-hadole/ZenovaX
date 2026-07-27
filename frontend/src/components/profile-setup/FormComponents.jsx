export const FieldGroup = ({ label, required, children, description }) => (
    <label className="space-y-1.5 block">
        <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text">{label}</span>
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
        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
            active
                ? 'bg-[#6F66FF] text-white border-[#6F66FF]'
                : 'border-white/30 bg-white/60 backdrop-blur-md text-text-muted hover:border-[#6F66FF]/40 hover:text-text'
        }`}
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
