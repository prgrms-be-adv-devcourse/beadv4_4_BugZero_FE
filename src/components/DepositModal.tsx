'use client';

interface DepositModalProps {
    isOpen: boolean;
    depositAmount: number;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
}

export default function DepositModal({ isOpen, depositAmount, onClose, onConfirm, loading = false }: DepositModalProps) {
    if (!isOpen) return null;

    const formattedDeposit = new Intl.NumberFormat('ko-KR').format(depositAmount);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
            <div className="bg-[#0d0d0d] rounded-2xl p-8 max-w-sm w-full border border-[#1a1a1a]">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">💰</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">보증금 결제 안내</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        첫 입찰 시 보증금(시작가의 10%)이<br />지갑에서 차감(Hold)됩니다.
                    </p>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-[#333]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">보증금</span>
                        <span className="text-white font-bold">₩{formattedDeposit}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                        *유찰 시 100% 환불됩니다.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 bg-[#1a1a1a] text-gray-400 py-3.5 rounded-xl hover:bg-[#262626] transition font-medium disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 bg-blue-600 py-3.5 rounded-xl text-white font-bold hover:bg-blue-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                        {loading ? '처리 중...' : '동의 및 입찰'}
                    </button>
                </div>
            </div>
        </div>
    );
}
