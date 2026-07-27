export const FieldGroup = ({ label, required, children, description }) => (
    <label className="space-y-1.5 block">
        <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#25354A', fontWeight: 600 }}>{label}</span>
            {required && (
                <span className="text-[9px] text-text-subtle font-medium">*</span>
            )}
        </div>
        {description && <p className="text-xs" style={{ color: '#52738F' }}>{description}</p>}
        {children}
    </label>
);

export const Chip = ({ label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
            active
                ? 'text-white border-transparent'
                : 'border border-white/30 bg-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/30 hover:border-white/40 text-[#1F2F43]'
        }`}
        style={active ? { background: '#7674E9' } : {}}
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
