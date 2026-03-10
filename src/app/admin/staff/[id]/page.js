'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { Activity, Star, TrendingDown, TrendingUp, Users, ArrowLeft, Calendar, User, FileText, CheckCircle2, Phone, MapPin, Briefcase, FileSignature, Receipt, HeartPulse, Building2, HeartHandshake, ChevronDown, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

export default function StaffDetail({ params }) {
    const resolvedParams = use(params);
    const staffId = resolvedParams.id;

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [staffData, setStaffData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [submissions, setSubmissions] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(prof);
            if (prof?.role !== 'admin') return;

            const date = new Date();
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

            const [
                { data: staffProf },
                { data: fvData }, { data: vipData }, { data: campsData }, { data: reviewsData },
                { data: tieupsData }, { data: reportsData }, { data: conversionsData }, { data: finData }
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', staffId).single(),
                supabase.from('field_visits').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
                supabase.from('vip_meetings').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
                supabase.from('camps').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
                supabase.from('reviews').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
                supabase.from('corporate_tieups').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
                supabase.from('camp_reports').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
                supabase.from('camp_conversions').select('*').eq('user_id', staffId).gte('camp_date', firstDay).lte('camp_date', lastDay),
                supabase.from('financials').select('*').eq('user_id', staffId).gte('date', firstDay).lte('date', lastDay),
            ]);

            const calculateTotalRevenue = (record) => {
                return (record.op_invoice || 0) + (record.amount_paid || 0) + (record.pharmacy_amount || 0);
            };

            const actuals = {
                '1a': (fvData || []).filter(v => v.prospect_type === 'Doctor/Clinic').length,
                '1b': (fvData || []).filter(v => v.prospect_type === 'Ambulance').length,
                '1c': (fvData || []).filter(v => v.prospect_type === 'Other').length,
                '2': (vipData || []).length,
                '3': (campsData || []).filter(r => r.stage === 'Camp').length,
                '4': (reviewsData || []).reduce((sum, r) => sum + (r.no_of_reviews || 0), 0),
                '5': (tieupsData || []).length,
                '6': (reportsData || []).length,
                '7': (conversionsData || []).length,
                '8': (finData || []).reduce((sum, r) => sum + calculateTotalRevenue(r), 0) / 100000,
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

            setStaffData({ ...staffProf, totalScore, stars, rows, salaryPenalty, incentiveDesc, actuals });

            setSubmissions({
                fieldVisits: fvData || [],
                vipMeetings: vipData || [],
                healthCamps: campsData || [],
                reviews: reviewsData || [],
                corporateTieups: tieupsData || [],
                campReports: reportsData || [],
                conversions: conversionsData || [],
                financials: finData || [],
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [staffId]);

    const calculateTotalRevenue = (record) => {
        return (record.op_invoice || 0) + (record.amount_paid || 0) + (record.pharmacy_amount || 0);
    };

    if (loading) return <div className="flex h-[80vh] items-center justify-center text-teal-700"><Activity className="w-12 h-12 animate-spin" /></div>;
    if (profile?.role !== 'admin') return <div className="flex h-screen items-center justify-center text-3xl text-rose-500 font-bold bg-slate-50">Access Denied</div>;
    if (!staffData) return <div className="flex h-screen items-center justify-center text-xl text-slate-500 font-bold bg-slate-50">Staff member not found.</div>;

    const tabs = [
        { id: 'overview', label: 'Detailed Overview' },
        { id: 'fieldVisits', label: 'Field Visits' },
        { id: 'vipMeetings', label: 'VIP Meetings' },
        { id: 'healthCamps', label: 'Health Camps' },
        { id: 'corporate', label: 'Corporate Tieups' },
        { id: 'reports', label: 'Reports & Conversions' },
        { id: 'financials', label: 'Financials & Reviews' },
    ];

    const ImagePreview = ({ url }) => {
        if (!url) return null;
        return (
            <div className="mt-4 pt-4 border-t border-slate-100">
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl transition-colors font-bold text-sm">
                    <ImageIcon size={18} /> View Uploaded Media
                </a>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link href="/admin" className="inline-flex items-center text-slate-500 hover:text-teal-700 font-bold gap-2 py-2 px-4 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow transition-all w-fit">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>

                {/* Profile Header Block */}
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-8 md:p-12 relative overflow-hidden border border-slate-100">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>
                    <div className="absolute top-8 right-8 text-teal-900/5 z-0 pointer-events-none">
                        <User size={240} strokeWidth={1} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
                                <span>Staff Profile Analysis</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
                                {staffData.full_name || staffData.email}
                            </h1>
                            <p className="text-slate-500 font-medium flex items-center gap-2 text-lg">
                                <Users size={18} /> Staff ID: <span className="text-slate-700 font-bold">{staffData.id.slice(0, 8)}...</span>
                            </p>
                        </div>

                        <div className="flex gap-4 mb-2">
                            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                                <div className="text-xs text-slate-400 font-bold tracking-widest mb-1">KRA SCORE</div>
                                <div className="text-4xl font-black">{staffData.totalScore.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                        <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                            <div className="bg-amber-100 text-amber-500 p-4 rounded-xl shrink-0"><Star size={28} className="fill-current" /></div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 tracking-wider">PERFORMANCE</p>
                                <div className="flex gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={20} className={`${s <= staffData.stars ? (staffData.stars >= 4 ? 'text-emerald-500' : staffData.stars === 3 ? 'text-amber-500' : 'text-rose-500') : 'text-slate-200'} ${s <= staffData.stars && 'fill-current'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                            <div className={`p-4 rounded-xl shrink-0 ${staffData.salaryPenalty < 0 ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                                <TrendingDown size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 tracking-wider">PENALTY</p>
                                <span className={`text-2xl font-black block mt-1 ${staffData.salaryPenalty < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {staffData.salaryPenalty < 0 ? `- ₹${Math.abs(staffData.salaryPenalty).toLocaleString()}` : "None"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl shrink-0"><TrendingUp size={28} /></div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 tracking-wider">INCENTIVE STATUS</p>
                                <span className="text-2xl font-black text-emerald-600 block mt-1 truncate">{staffData.incentiveDesc}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Dropdown Tab Navigation */}
                <div className="flex flex-col md:flex-row items-center gap-4 border-b border-slate-200 pb-4">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest shrink-0">Analysis View</label>
                    <div className="relative w-full md:w-80">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="w-full appearance-none bg-white border-2 border-teal-100 text-teal-900 px-5 py-3.5 pr-12 rounded-2xl font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer"
                        >
                            {tabs.map(tab => (
                                <option key={tab.id} value={tab.id}>{tab.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-teal-600">
                            <ChevronDown size={20} strokeWidth={3} />
                        </div>
                    </div>
                </div>

                {/* Tab Contents */}
                <div className="mt-4 transition-all duration-500">
                    {activeTab === 'overview' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center gap-3">
                                <Activity className="text-teal-600" /> KRA Performance Targets
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100">
                                            <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest w-1/4">Key Result Area</th>
                                            <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Weightage</th>
                                            <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Target</th>
                                            <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actual</th>
                                            <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Gap</th>
                                            <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest w-1/4">Progress</th>
                                            <th className="px-6 py-5 text-xs font-black text-teal-600 uppercase tracking-widest text-right">% of Weightage Achieved</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {staffData.rows.map(row => (
                                            <tr key={row.kra.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5 font-bold text-slate-700">{row.kra.title}</td>
                                                <td className="px-4 py-5 font-bold text-slate-500 text-center">{row.kra.weightage}%</td>
                                                <td className="px-4 py-5 font-medium text-slate-400 text-center">{row.kra.target}</td>
                                                <td className="px-4 py-5 font-black text-slate-900 text-lg text-center">{row.actual}</td>
                                                <td className="px-4 py-5 font-bold text-rose-500 text-center">{row.gap}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden ring-1 ring-inset ring-slate-200/50">
                                                            <div className={`h-full rounded-full transition-all duration-1000 ${row.achieved >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(row.achieved, 100)}%` }}></div>
                                                        </div>
                                                        <span className="font-bold text-slate-600 text-sm w-12 text-right">{row.achieved.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-teal-700 text-lg">{row.weightageAchieved.toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fieldVisits' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><MapPin className="text-indigo-500" /> Field Visits Logs</h2>
                                <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.fieldVisits.length} Records</span>
                            </div>
                            {submissions.fieldVisits.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No field visits recorded.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {submissions.fieldVisits.map((v, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-3xl -z-0"></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg">{v.prospect_type}</span>
                                                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.date).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="font-extrabold text-xl text-slate-900 mb-2 truncate" title={v.name || 'N/A'}>{v.name || 'N/A'}</h3>

                                                <div className="space-y-2 mb-4">
                                                    {v.place && <p className="text-sm text-slate-600 flex items-start gap-2"><MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{v.place}</span></p>}
                                                    {v.phone && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={16} className="text-slate-400 shrink-0" /> {v.phone}</p>}
                                                </div>

                                                {(v.pitch || v.remarks) && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                                        {v.pitch && <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Pitch / Discussion</span><p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2" title={v.pitch}>{v.pitch}</p></div>}
                                                        {v.remarks && <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Remarks</span><p className="text-sm text-slate-700 italic">{v.remarks}</p></div>}
                                                    </div>
                                                )}

                                                <ImagePreview url={v.image_url} />

                                                <div className="mt-4 flex gap-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${v.status === 'C' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Status: {v.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'vipMeetings' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><Users className="text-amber-500" /> VIP Meetings</h2>
                                <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.vipMeetings.length} Records</span>
                            </div>
                            {submissions.vipMeetings.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No VIP meetings recorded.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {submissions.vipMeetings.map((v, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-900/5 transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-3xl -z-0"></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-amber-500 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg">VIP Meeting</span>
                                                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.date).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="font-extrabold text-xl text-slate-900 mb-3 truncate" title={v.vip_name || 'N/A'}>{v.vip_name || 'N/A'}</h3>

                                                <div className="space-y-2 mb-4">
                                                    {v.phone && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={16} className="text-slate-400 shrink-0" /> {v.phone}</p>}
                                                </div>

                                                {(v.pitch || v.remarks) && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                                        {v.pitch && <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Discussion</span><p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{v.pitch}</p></div>}
                                                        {v.remarks && <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Outcome / Remarks</span><p className="text-sm text-slate-700 italic">{v.remarks}</p></div>}
                                                    </div>
                                                )}

                                                <ImagePreview url={v.image_url} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'healthCamps' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><HeartPulse className="text-rose-500" /> Health Camps</h2>
                                <span className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.healthCamps.length} Records</span>
                            </div>
                            {submissions.healthCamps.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No health camps recorded.</p> : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {submissions.healthCamps.map((v, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-900/5 transition-all flex flex-col gap-6">
                                            <div className="flex flex-col sm:flex-row gap-6 w-full">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg ${v.stage === 'Camp' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 text-slate-600'}`}>{v.stage}</span>
                                                        <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <h3 className="font-extrabold text-xl text-slate-900 mb-2">{v.place || 'N/A'}</h3>

                                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Budget</span>
                                                            <span className="text-lg font-black text-slate-700">{v.budget ? `₹${v.budget}` : '-'}</span>
                                                        </div>
                                                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                            <span className="text-[10px] uppercase tracking-widest font-bold text-rose-400 block mb-1">Walk-ins</span>
                                                            <span className="text-lg font-black text-rose-700">{v.walkins || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {v.remarks && (
                                                    <div className="sm:w-64 bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-center">
                                                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Remarks</span>
                                                        <p className="text-sm text-slate-700 italic">{v.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <ImagePreview url={v.image_url} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'corporate' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><Building2 className="text-blue-500" /> Corporate Tieups</h2>
                                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.corporateTieups.length} Records</span>
                            </div>
                            {submissions.corporateTieups.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No corporate tie-ups recorded.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {submissions.corporateTieups.map((v, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-extrabold text-xl text-slate-900">{v.company_name || 'N/A'}</h3>
                                                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="space-y-2 mb-5 text-sm text-slate-600">
                                                <p className="flex items-center gap-2"><User size={16} className="text-slate-400" /> <span className="font-bold text-slate-700">{v.contact_person}</span></p>
                                                <p className="flex items-center gap-2"><Phone size={16} className="text-slate-400" /> {v.phone || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                                {v.letter_received ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"><CheckCircle2 size={14} /> Letter Received</div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Pending Letter</div>
                                                )}
                                            </div>
                                            {v.remarks && <p className="text-sm text-slate-600 italic mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">{v.remarks}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="space-y-12">
                            {/* Camp Reports Section */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><FileSignature className="text-teal-600" /> Camp Reports</h2>
                                    <span className="bg-teal-100 text-teal-800 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.campReports.length} Records</span>
                                </div>
                                {submissions.campReports.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No camp reports recorded.</p> : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {submissions.campReports.map((v, i) => (
                                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-xl transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="font-extrabold text-xl text-slate-900">{v.program_name || 'N/A'}</h3>
                                                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    {v.place && <p className="text-sm text-slate-600 flex items-start gap-2"><MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" /> <span>{v.place}</span></p>}
                                                    {v.contact_person && <p className="text-sm text-slate-600 flex items-center gap-2"><User size={16} className="text-slate-400 shrink-0" /> {v.contact_person}</p>}
                                                </div>
                                                {v.remarks && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Remarks</span>
                                                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{v.remarks}</p>
                                                    </div>
                                                )}
                                                <ImagePreview url={v.image_url} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-200" />

                            {/* Camp Conversions Section */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><HeartHandshake className="text-emerald-500" /> Patient Conversions</h2>
                                    <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.conversions.length} Records</span>
                                </div>
                                {submissions.conversions.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No conversions recorded.</p> : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {submissions.conversions.map((v, i) => (
                                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 hover:shadow-xl transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded mb-2 inline-block">{v.category} PATIENT</span>
                                                        <h3 className="font-extrabold text-xl text-slate-900">{v.beneficiary_name || 'N/A'}</h3>
                                                    </div>
                                                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.camp_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    {v.place && <p className="text-sm text-slate-600 flex items-start gap-2"><MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" /> <span>Camp Place: <span className="font-bold text-slate-700">{v.place}</span></span></p>}
                                                    {v.treatment && <p className="text-sm text-slate-600 flex items-center gap-2"><Briefcase size={16} className="text-slate-400 shrink-0" /> Treatment: <span className="font-bold text-slate-700">{v.treatment}</span></p>}
                                                </div>
                                                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Revenue Generated</span>
                                                    <span className="text-2xl font-black text-emerald-600">₹{v.amount_paid?.toLocaleString('en-IN') || 0}</span>
                                                </div>
                                                {v.remarks && <p className="text-sm text-slate-600 italic mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">{v.remarks}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="space-y-12">
                            {/* Financials Section */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><Receipt className="text-emerald-600" /> Core Financials</h2>
                                    <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.financials.length} Records</span>
                                </div>
                                {submissions.financials.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No financial entries recorded.</p> : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {submissions.financials.map((v, i) => {
                                            const total = calculateTotalRevenue(v);
                                            return (
                                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-600 hover:shadow-xl transition-all">
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div>
                                                            <h3 className="font-extrabold text-xl text-slate-900">{v.beneficiary_name || 'N/A'}</h3>
                                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1 block">Category: <span className="text-slate-700">{v.category}</span></span>
                                                        </div>
                                                        <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={14} /> {new Date(v.date).toLocaleDateString()}</span>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                                        <div className="grid grid-cols-3 divide-x divide-slate-100">
                                                            <div className="p-3 text-center">
                                                                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">OP Amount</div>
                                                                <div className="font-bold text-slate-800">₹{v.op_invoice || 0}</div>
                                                            </div>
                                                            <div className="p-3 text-center">
                                                                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">IP Amount</div>
                                                                <div className="font-bold text-slate-800">₹{v.amount_paid || 0}</div>
                                                            </div>
                                                            <div className="p-3 text-center">
                                                                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Pharmacy</div>
                                                                <div className="font-bold text-slate-800">₹{v.pharmacy_amount || 0}</div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-emerald-50 px-5 py-3 flex justify-between items-center border-t border-emerald-100/50">
                                                            <span className="font-bold text-emerald-800/60 text-xs uppercase tracking-widest">Total Record Revenue</span>
                                                            <span className="font-black text-xl text-emerald-700">₹{total.toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-200" />

                            {/* Google Reviews Section */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><Star className="text-amber-500 fill-current" /> Google Reviews</h2>
                                    <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-bold text-sm">{submissions.reviews.length} Batches</span>
                                </div>
                                {submissions.reviews.length === 0 ? <p className="text-slate-500 italic p-8 bg-white rounded-2xl border border-slate-200 text-center">No review entries recorded.</p> : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {submissions.reviews.map((v, i) => (
                                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all flex flex-col items-center justify-center text-center">
                                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 mb-3"><Calendar size={12} /> {new Date(v.date).toLocaleDateString()}</span>
                                                <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                                                    <Star fill="currentColor" size={28} className="text-amber-500" />
                                                </div>
                                                <div className="text-3xl font-black text-slate-800">+{v.no_of_reviews}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Reviews</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
