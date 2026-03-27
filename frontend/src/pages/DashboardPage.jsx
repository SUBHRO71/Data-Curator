import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatasets } from '../services/api';
import { Plus, Database, Clock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
const cn = (...inputs) => twMerge(clsx(inputs));

const DashboardPage = () => {
    const navigate = useNavigate();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDatasets();
        // Mock polling for updates
        const interval = setInterval(fetchDatasets, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDatasets = async () => {
        try {
            const data = await getDatasets();
            setDatasets(data);
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

    return (
        <div className="py-6 w-full fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Datasets</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage, analyze, and validiate your machine learning training data.</p>
                </div>
                <button
                    onClick={() => navigate('/upload')}
                    className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Dataset
                </button>
            </div>

            {datasets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center flex flex-col items-center justify-center">
                    <Database className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">No datasets found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mb-6 text-sm">You haven't uploaded any datasets yet. Click the button above to get started.</p>
                    <button
                        onClick={() => navigate('/upload')}
                        className="flex items-center px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 shadow-sm transition-all font-medium text-sm"
                    >
                        Upload Data
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {datasets.map((dataset) => {
                        const report = dataset.complianceReports?.[0];
                        const isProcessing = dataset.status === 'Processing';
                        const scoreColor = report?.overallScore >= 90 ? 'text-emerald-500' 
                                            : report?.overallScore >= 70 ? 'text-amber-500' 
                                            : 'text-red-500';

                        return (
                            <div 
                                key={dataset.id} 
                                onClick={() => navigate(`/dataset/${dataset.id}`)}
                                className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                                            dataset.status === 'Ready' ? "bg-emerald-50 text-emerald-700" :
                                            dataset.status === 'Failed' ? "bg-red-50 text-red-700" :
                                            "bg-amber-50 text-amber-700 animate-pulse"
                                        )}>
                                            {dataset.status === 'Processing' && <Clock className="w-3 h-3 mr-1" />}
                                            {dataset.status === 'Ready' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {dataset.status === 'Failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {dataset.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{dataset.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Created {new Date(dataset.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                
                                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <ShieldAlert className={cn("w-4 h-4 mr-1.5", isProcessing ? "text-slate-400" : scoreColor)} />
                                        <span className="text-sm font-semibold text-slate-700">
                                            {isProcessing ? 'Evaluating...' : report ? `${report.overallScore}/100 Score` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                        View &rarr;
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
