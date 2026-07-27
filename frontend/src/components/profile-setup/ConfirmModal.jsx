import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ isOpen, onClose, onConfirm, icon: Icon, iconBgClass, iconColorClass, title, description, confirmText, confirmBtnClass }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-sm mx-4 w-full"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBgClass}`}>
                                <Icon className={`w-4 h-4 ${iconColorClass}`} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#1F2F43]">{title}</h3>
                                <p className="text-xs text-[#4A5D73]">{description}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 rounded-lg border border-[#CBD5E1] text-[#4A5D73] font-semibold hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={`flex-1 px-4 py-2 rounded-lg text-white font-bold transition-colors text-sm ${confirmBtnClass}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
