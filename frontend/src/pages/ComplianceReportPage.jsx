import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplianceReport } from '../services/api';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ComplianceReportPage = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            const data = await getComplianceReport(id);
            setReport(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!report) return (
        <div className="p-6">
            <Link to={`/dataset/${id}`} className="text-indigo-600 mb-4 inline-block">&larr; Back to Dataset</Link>
            <p>Report not available yet. Please allow time for processing.</p>
        </div>
    );

    const scoreColor = report.overallScore >= 90 ? 'text-emerald-500' 
                        : report.overallScore >= 70 ? 'text-amber-500' 
                        : 'text-red-500';
                        
    const circleColor = report.overallScore >= 90 ? '#10b981' 
                        : report.overallScore >= 70 ? '#f59e0b' 
                        : '#ef4444';

    return (
        <div className="py-6 w-full max-w-5xl mx-auto fade-in pb-16">
            <Link to={`/dataset/${id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dataset
            </Link>
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                    <ShieldAlert className="w-7 h-7 mr-3 text-indigo-600" />
                    Compliance & Ethics Report
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Automated evaluation against PII, hate speech, and ethical guidelines.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center justify-center h-full">
                        <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">Overall Trust Score</h3>
                        
                        {/* Custom SVG Donut Chart */}
                        <div className="relative w-48 h-48 mb-6">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                                <circle 
                                    cx="50" cy="50" r="40" 
                                    stroke={circleColor} 
                                    strokeWidth="8" 
                                    fill="none" 
                                    strokeLinecap="round"
                                    strokeDasharray={`${(report.overallScore / 100) * 251.2} 251.2`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={cn("text-5xl font-black tracking-tighter", scoreColor)}>{report.overallScore}</span>
                                <span className="text-sm font-medium text-slate-400 mt-1">out of 100</span>
                            </div>
                        </div>

                        {report.overallScore >= 90 && <p className="text-emerald-600 font-medium text-sm">Excellent! Highly compliant.</p>}
                        {report.overallScore >= 70 && report.overallScore < 90 && <p className="text-amber-600 font-medium text-sm">Action advised before usage.</p>}
                        {report.overallScore < 70 && <p className="text-red-600 font-medium text-sm">Critical violations detected.</p>}
                    </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Violations */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-red-800 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Critical Violations
                            </h3>
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{report.violations?.length || 0} issues</span>
                        </div>
                        <div className="p-6">
                            {report.violations?.length > 0 ? (
                                <ul className="space-y-4">
                                    {report.violations.map((v, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-red-500 mt-2 mr-3"></span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{v.issue}</p>
                                                <p className="text-xs text-slate-500 mt-1">File ID: {String(v.fileId).slice(0, 8)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center text-sm font-medium text-emerald-600">
                                    <CheckCircle className="w-5 h-5 mr-2" /> No critical privacy violations found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warnings & Suggestions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-amber-800 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Warnings
                                </h3>
                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{report.warnings?.length || 0}</span>
                            </div>
                            <div className="p-5 flex-1">
                                {report.warnings?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {report.warnings.map((w, i) => (
                                            <li key={i} className="text-sm text-slate-700 pb-2 border-b border-slate-50 last:border-0 last:pb-0">{w.issue}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No ethical warnings.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-indigo-800 flex items-center">Auto-Fix Suggestions</h3>
                            </div>
                            <div className="p-5 flex-1 bg-slate-50/50">
                                {report.autoFixSuggestions?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {report.autoFixSuggestions.map((s, i) => (
                                            <li key={i} className="text-sm border border-slate-200 bg-white px-3 py-2 rounded-lg text-slate-700 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">All good.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceReportPage;
