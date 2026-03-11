'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Activity, Users, Star, TrendingDown, TrendingUp, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const KRAS = [
    { id: '1a', title: '1a. Doctors/Clinics', target: 52, weightage: 15 },
    { id: '1b', title: '1b. Ambulance', target: 26, weightage: 5 },
    { id: '1c', title: '1c. Other Orgs', target: 52, weightage: 10 },
    { id: '2', title: '2. VIP Meetings', target: 10, weightage: 10 },
    { id: '3', title: '3. Health Camps', target: 1, weightage: 10 },
    { id: '4', title: '4. Google Reviews', target: 25, weightage: 10 },
    { id: '5', title: '5. Corporate Tie-ups', target: 2, weightage: 10 },
    { id: '6', title: '6. Camp Report', target: 1, weightage: 10 },
    { id: '7', title: '7. Conversions', target: 5, weightage: 10 },
    { id: '8', title: '8. Financials', target: 5, weightage: 10 },
];

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [staffData, setStaffData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(prof);
            if (prof?.role !== 'admin') return;

            const firstDay = new Date(selectedYear, selectedMonth, 1).toISOString();
            const lastDay = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();

            const [
                { data: users },
                { data: fvData }, { data: vipData }, { data: campsData }, { data: reviewsData },
                { data: tieupsData }, { data: reportsData }, { data: conversionsData }, { data: finData }
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('role', 'staff'),
                supabase.from('field_visits').select('user_id, prospect_type').gte('date', firstDay).lte('date', lastDay),
                supabase.from('vip_meetings').select('user_id').gte('date', firstDay).lte('date', lastDay),
                supabase.from('camps').select('user_id, stage').gte('date', firstDay).lte('date', lastDay),
                supabase.from('reviews').select('user_id, no_of_reviews').gte('date', firstDay).lte('date', lastDay),
                supabase.from('corporate_tieups').select('user_id').gte('date', firstDay).lte('date', lastDay),
                supabase.from('camp_reports').select('user_id').gte('date', firstDay).lte('date', lastDay),
                supabase.from('camp_conversions').select('user_id').gte('camp_date', firstDay).lte('camp_date', lastDay),
                supabase.from('financials').select('user_id, total_revenue').gte('date', firstDay).lte('date', lastDay),
            ]);

            const analytics = (users || []).map(staff => {
                const fv = (fvData || []).filter(r => r.user_id === staff.id);
                const actuals = {
                    '1a': fv.filter(v => v.prospect_type === 'Doctor/Clinic').length,
                    '1b': fv.filter(v => v.prospect_type === 'Ambulance').length,
                    '1c': fv.filter(v => v.prospect_type === 'Other').length,
                    '2': (vipData || []).filter(r => r.user_id === staff.id).length,
                    '3': (campsData || []).filter(r => r.user_id === staff.id && r.stage === 'Camp').length,
                    '4': (reviewsData || []).filter(r => r.user_id === staff.id).reduce((sum, r) => sum + (r.no_of_reviews || 0), 0),
                    '5': (tieupsData || []).filter(r => r.user_id === staff.id).length,
                    '6': (reportsData || []).filter(r => r.user_id === staff.id).length,
                    '7': (conversionsData || []).filter(r => r.user_id === staff.id).length,
                    '8': (finData || []).filter(r => r.user_id === staff.id).reduce((sum, r) => sum + (r.total_revenue || 0), 0) / 100000,
                };

                let totalScore = 0;
                const rows = KRAS.map(kra => {
                    const actual = actuals[kra.id] || 0;
                    const achievedRaw = (actual / kra.target) * 100;
                    const achieved = Math.min(achievedRaw, 100);
                    const gap = (kra.target - actual) < 0 ? 0 : (kra.target - actual);
                    const weightageAchieved = (achieved / 100) * kra.weightage;
                    totalScore += weightageAchieved;
                    return { kra, actual, achieved, gap, weightageAchieved };
                });

                const getStars = (score) => {
                    if (score >= 90) return 5;
                    if (score >= 80) return 4;
                    if (score >= 70) return 3;
                    if (score >= 60) return 2;
                    return 1;
                };

                const stars = getStars(totalScore);

                let salaryPenalty = 0;
                if (stars === 4) salaryPenalty = -1000;
                else if (stars === 3) salaryPenalty = -2000;
                else if (stars <= 2) salaryPenalty = -5000;

                const totalRevenueLakhs = actuals['8'];

                let incentiveDesc = "No Incentive";
                if (totalRevenueLakhs > 13) incentiveDesc = "+10000 Base & 3%";
                else if (totalRevenueLakhs > 10) incentiveDesc = "+8000 Base & 3%";
                else if (totalRevenueLakhs > 7) incentiveDesc = "+5000 Base & 4%";
                else if (totalRevenueLakhs > 5) incentiveDesc = "5% Incentive";

                return { ...staff, totalScore, stars, rows, salaryPenalty, incentiveDesc, actuals };
            });

            setStaffData(analytics.sort((a, b) => b.totalScore - a.totalScore));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

    if (loading) return <div className="flex h-[50vh] items-center justify-center text-teal-700 animate-pulse"><Activity className="w-8 h-8" /></div>;
    if (profile?.role !== 'admin') return <div className="text-center p-10 text-rose-500 font-bold">Access Denied. Admins Only.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Admin Live Analytics</h1>
                    <p className="text-slate-500 mt-2 font-medium">Monitor, verify, and track all staff members automatically based on their form submissions.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <Calendar size={18} className="text-slate-400 ml-2" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-slate-700 font-bold text-sm cursor-pointer outline-none"
                        >
                            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent border-none text-slate-700 font-bold text-sm cursor-pointer outline-none pl-1 border-l border-slate-200"
                        >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border border-white/60">
                    <div className="flex items-center space-x-3 text-teal-700 mb-4 bg-teal-50/50 w-fit p-2 rounded-xl"><Users size={20} /><h3 className="font-bold text-sm uppercase tracking-wider">Total Active Staff</h3></div>
                    <span className="text-5xl font-black text-slate-800 drop-shadow-sm">{staffData.length}</span>
                </div>
                <div className="glass-card p-6 border border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30">
                    <div className="flex items-center space-x-3 text-emerald-700 mb-4 bg-emerald-100/50 w-fit p-2 rounded-xl"><TrendingUp size={20} /><h3 className="font-bold text-sm uppercase tracking-wider">Top Performers (&gt;90%)</h3></div>
                    <span className="text-5xl font-black text-emerald-600 drop-shadow-sm">{staffData.filter(s => s.stars === 5).length}</span>
                </div>
                <div className="glass-card p-6 border border-rose-200/50 bg-gradient-to-br from-rose-50/50 to-rose-100/30">
                    <div className="flex items-center space-x-3 text-rose-700 mb-4 bg-rose-100/50 w-fit p-2 rounded-xl"><TrendingDown size={20} /><h3 className="font-bold text-sm uppercase tracking-wider">Underperforming (&lt;70%)</h3></div>
                    <span className="text-5xl font-black text-rose-600 drop-shadow-sm">{staffData.filter(s => s.stars <= 2).length}</span>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">Staff Rankings & Financial Overviews</h2>
                {staffData.map((staff, idx) => (
                    <div key={staff.id} className="glass-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-teal-900/5">
                        <div
                            onClick={() => window.open(`/admin/staff/${staff.id}?month=${selectedMonth}&year=${selectedYear}`, '_blank')}
                            className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
                        >
                            <div className="flex items-center space-x-5 mb-4 md:mb-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${staff.stars >= 4 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30' : staff.stars === 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' : 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30'
                                    }`}>
                                    #{idx + 1}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{staff.full_name || staff.email}</h3>
                                    <div className="flex items-center space-x-1 mt-1.5 bg-white/50 w-fit px-2 py-1 rounded-lg border border-white/60">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} className={`${s <= staff.stars ? (staff.stars >= 4 ? 'text-emerald-500' : staff.stars === 3 ? 'text-amber-500' : 'text-rose-500') : 'text-slate-300'} ${s <= staff.stars && 'fill-current'}`} />
                                        ))}
                                        <span className="text-sm font-bold ml-2 text-slate-600 border-l border-slate-300 pl-2">% Weightage: {staff.totalScore.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-8 text-sm">
                                <div className="text-right">
                                    <div className="text-slate-400 font-bold tracking-widest text-[10px] mb-1">SALARY PENALTY</div>
                                    <div className={`font-black text-lg ${staff.salaryPenalty < 0 ? 'text-rose-600 drop-shadow-sm' : 'text-emerald-600 drop-shadow-sm'}`}>
                                        {staff.salaryPenalty < 0 ? `- ₹${Math.abs(staff.salaryPenalty).toLocaleString()}` : "Active Base"}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 font-bold tracking-widest text-[10px] mb-1">INCENTIVE PROJECTION</div>
                                    <div className="font-black text-lg text-teal-700 drop-shadow-sm">{staff.incentiveDesc}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
                {staffData.length === 0 && <p className="text-slate-500 text-center py-10">No staff accounts registered yet.</p>}
            </div>
        </div>
    );
}
