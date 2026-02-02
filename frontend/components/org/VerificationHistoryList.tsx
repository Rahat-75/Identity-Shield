
import { useEffect, useState } from 'react';
import { credentialsApi } from '@/lib/credentials-api';
import { History, UserCheck, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function VerificationHistoryList() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const { data } = await credentialsApi.getHistory();
        if (data) {
            // Group by citizen_id to show unique people
            const grouped = data.reduce((acc: any[], curr: any) => {
                const existing = acc.find(item => item.citizen_id === curr.citizen_id);
                if (existing) {
                    existing.count = (existing.count || 1) + 1;
                    // Keep the latest timestamp
                    if (new Date(curr.verified_at) > new Date(existing.verified_at)) {
                        existing.verified_at = curr.verified_at;
                    }
                } else {
                    acc.push({ ...curr, count: 1 });
                }
                return acc;
            }, []);
            
            // Re-sort by latest verification
            grouped.sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime());
            
            setHistory(grouped);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading history...</div>;

    if (history.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No verification history found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Verified Citizens</h3>
                </div>
                <span className="text-xs text-gray-400 font-medium">{history.length} unique citizens</span>
            </div>
            <div className="divide-y divide-gray-100">
                {history.map((record) => (
                    <div key={record.citizen_id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-900">{record.citizen_name}</p>
                                    {record.count > 1 && (
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                            {record.count}x Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Last verified on {new Date(record.verified_at).toLocaleDateString()} at {new Date(record.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                Active
                           </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
