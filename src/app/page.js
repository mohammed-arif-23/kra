'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Activity, Star, AlertTriangle, RefreshCw } from 'lucide-react';

import { useRouter } from 'next/navigation';

const KRAS = [
  { id: '1a', title: '1a. Field Visits (Doctor/Clinic)', target: 52, weightage: 15 },
  { id: '1b', title: '1b. Field Visits (Ambulance)', target: 26, weightage: 5 },
  { id: '1c', title: '1c. Field Visits (Other Orgs)', target: 52, weightage: 10 },
  { id: '2', title: '2. VIP Meetings', target: 10, weightage: 10 },
  { id: '3', title: '3. Health Camps', target: 1, weightage: 10 },
  { id: '4', title: '4. Google Reviews', target: 25, weightage: 10 },
  { id: '5', title: '5. Corporate Tie-ups', target: 2, weightage: 10 },
  { id: '6', title: '6. Health Camp Report', target: 1, weightage: 10 },
  { id: '7', title: '7. Camp Conversions', target: 5, weightage: 10 },
  { id: '8', title: '8. Monthly Financial Target (Lakhs)', target: 5, weightage: 10 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof?.role === 'admin') {
        router.push('/admin');
        return;
      }
      setProfile(prof);

      // Get first and last day of current month contextually
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

      // Parallel fetching for performance
      const [
        { data: fvData },
        { data: vipData },
        { data: campsData },
        { data: reviewsData },
        { data: tieupsData },
        { data: reportsData },
        { data: conversionsData },
        { data: finData }
      ] = await Promise.all([
        supabase.from('field_visits').select('prospect_type').gte('date', firstDay).lte('date', lastDay),
        supabase.from('vip_meetings').select('id').gte('date', firstDay).lte('date', lastDay),
        supabase.from('camps').select('stage').gte('date', firstDay).lte('date', lastDay),
        supabase.from('reviews').select('no_of_reviews').gte('date', firstDay).lte('date', lastDay),
        supabase.from('corporate_tieups').select('id').gte('date', firstDay).lte('date', lastDay),
        supabase.from('camp_reports').select('id').gte('date', firstDay).lte('date', lastDay),
        supabase.from('camp_conversions').select('id').gte('camp_date', firstDay).lte('camp_date', lastDay),
        supabase.from('financials').select('total_revenue').gte('date', firstDay).lte('date', lastDay),
      ]);

      const fv = fvData || [];

      const counts = {
        '1a': fv.filter(v => v.prospect_type === 'Doctor/Clinic').length,
        '1b': fv.filter(v => v.prospect_type === 'Ambulance').length,
        '1c': fv.filter(v => v.prospect_type === 'Other').length,
        '2': (vipData || []).length,
        '3': (campsData || []).filter(c => c.stage === 'Camp').length,
        '4': (reviewsData || []).reduce((sum, r) => sum + (r.no_of_reviews || 0), 0),
        '5': (tieupsData || []).length,
        '6': (reportsData || []).length,
        '7': (conversionsData || []).length,
        '8': (finData || []).reduce((sum, r) => sum + (r.total_revenue || 0), 0) / 100000,
      };

      setData(counts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCalculations = (kra) => {
    const actual = data[kra.id] || 0;
    const achievedRaw = (actual / kra.target) * 100;
    const achieved = Math.min(achievedRaw, 100);
    const gapRaw = kra.target - actual;
    const gap = gapRaw < 0 ? 0 : gapRaw;
    const weightageAchieved = (achieved / 100) * kra.weightage;

    return { actual, achieved, gap, weightageAchieved };
  };

  let totalScore = 0;
  const rows = KRAS.map(kra => {
    const calc = getCalculations(kra);
    totalScore += calc.weightageAchieved;
    return { kra, ...calc };
  });

  const getStarsAndColor = (score) => {
    if (score >= 90) return { stars: 5, color: 'text-emerald-500', bar: 'bg-emerald-500' };
    if (score >= 80) return { stars: 4, color: 'text-teal-500', bar: 'bg-teal-500' };
    if (score >= 70) return { stars: 3, color: 'text-amber-500', bar: 'bg-amber-500' };
    if (score >= 60) return { stars: 2, color: 'text-orange-500', bar: 'bg-orange-500', warning: true };
    return { stars: 1, color: 'text-rose-500', bar: 'bg-rose-500', warning: true };
  };

  const { stars, color, bar, warning } = getStarsAndColor(totalScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-teal-700">
        <Activity className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">
            {profile?.role === 'admin' ? 'Admin ' : ''}My Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Your current month's performance evaluation and KRA metrics.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 bg-white/80 backdrop-blur-md text-teal-700 border border-teal-100 px-5 py-2.5 rounded-xl hover:bg-teal-50 hover:shadow-md transition-all font-semibold self-start"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-white/60">
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-slate-700 mb-2 uppercase tracking-wider text-sm">Combined Score</h2>
          <div className="flex items-end space-x-2">
            <span className={`text-7xl font-black tracking-tighter drop-shadow-sm ${color}`}>
              {totalScore.toFixed(1)}
            </span>
            <span className="text-xl text-slate-400 font-bold mb-2">/ 100</span>
          </div>

          <div className="mt-6 bg-slate-200/50 h-5 rounded-full overflow-hidden w-full max-w-md shadow-inner border border-slate-300/30">
            <div
              className={`h-full transition-all duration-1000 shadow-sm ${bar}`}
              style={{ width: `${totalScore}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end justify-center relative z-10">
          <h2 className="text-lg font-bold text-slate-700 mb-3 uppercase tracking-wider text-sm">Performance Rating</h2>
          <div className="flex items-center space-x-2 mb-2 bg-white/50 p-3 rounded-2xl border border-white shadow-sm">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-12 h-12 transition-all duration-500 ${star <= stars ? (star <= stars ? color : 'text-slate-300') : 'text-slate-300'} ${star <= stars && 'fill-current drop-shadow-md scale-110'}`}
              />
            ))}
          </div>
          {warning && (
            <div className="flex items-center space-x-2 bg-rose-50/80 backdrop-blur-md text-rose-700 px-4 py-2 rounded-xl border border-rose-200 mt-4 shadow-sm">
              <AlertTriangle size={20} className="animate-pulse" />
              <span className="font-bold text-sm">Sub-standard Performance Warning</span>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200/50 text-xs uppercase tracking-widest font-bold text-slate-500">
                <th className="px-6 py-5">Key Result Area (KRA)</th>
                <th className="px-6 py-5">Weightage</th>
                <th className="px-6 py-5">Target</th>
                <th className="px-6 py-5">Actual</th>
                <th className="px-6 py-5">GAP</th>
                <th className="px-6 py-5">% Achieved</th>
                <th className="px-6 py-5 bg-teal-50/50 text-teal-800 border-l border-teal-100/50 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {rows.map((row, idx) => (
                <tr key={row.kra.id} className="hover:bg-white/60 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-800">
                    {row.kra.title}
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-600 shadow-sm border border-slate-200/50">
                      {row.kra.weightage}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-500">{row.kra.target}</td>
                  <td className="px-6 py-5">
                    <span className={`font-black text-lg ${row.gap === 0 ? 'text-emerald-500' : 'text-slate-800'}`}>
                      {typeof row.actual === 'number' && row.actual % 1 !== 0 ? row.actual.toFixed(2) : row.actual}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-rose-500">{typeof row.gap === 'number' && row.gap % 1 !== 0 ? row.gap.toFixed(2) : row.gap}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-700 w-10">{row.achieved.toFixed(0)}%</span>
                      <div className="w-20 bg-slate-200/50 h-2.5 rounded-full overflow-hidden shrink-0 shadow-inner">
                        <div
                          className={`h-full ${row.achieved === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                          style={{ width: `${row.achieved}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-l border-slate-100/50 text-right">
                    <span className="font-black text-xl text-teal-700">{row.weightageAchieved.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-teal-900 to-teal-800 text-white shadow-xl font-bold">
                <td className="px-6 py-5 uppercase tracking-wider text-sm rounded-bl-2xl">Total Score Calculation</td>
                <td className="px-6 py-5 text-teal-100">100</td>
                <td colSpan={4}></td>
                <td className="px-6 py-5 text-right text-2xl text-teal-300 rounded-br-2xl border-l border-teal-700 shadow-inner">
                  {totalScore.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
