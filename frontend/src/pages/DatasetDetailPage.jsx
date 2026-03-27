import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDataset } from '../services/api';
import { ShieldCheck, Tag, Download, Play, FileText, Image as ImageIcon, FileAudio, FileVideo } from 'lucide-react';

const DatasetDetailPage = () => {
    const { id } = useParams();
    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchData = async () => {
        try {
            const data = await getDataset(id);
            setDataset(data);
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

    if (!dataset) return <div className="p-6">Dataset not found</div>;

    const report = dataset.complianceReports?.[0];
    const topViolations = report?.violations ? JSON.parse(report.violations) : [];
    const scoreColor = report?.overallScore >= 90 ? 'text-emerald-500'
        : report?.overallScore >= 70 ? 'text-amber-500'
        : 'text-red-500';

    const getFileIcon = (format) => {
        switch (format) {
            case 'IMAGE': return <ImageIcon className="w-5 h-5 text-indigo-500" />;
            case 'AUDIO': return <FileAudio className="w-5 h-5 text-sky-500" />;
            case 'VIDEO': return <FileVideo className="w-5 h-5 text-rose-500" />;
            default: return <FileText className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <div className="py-6 w-full fade-in pb-16">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{dataset.name}</h1>
                    <p className="text-slate-500 mt-1 text-sm">Created on {new Date(dataset.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                    <Link to={`/dataset/${dataset.id}/annotate`} className="flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all font-medium text-sm">
                        <Tag className="w-4 h-4 mr-2" />
                        Annotate
                    </Link>
                    <Link to={`/dataset/${dataset.id}/export`} className="flex items-center px-4 py-2 bg-indigo-600 text-white border border-transparent rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium text-sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center">
                    <div className="p-4 bg-indigo-50 rounded-xl mr-4 text-indigo-600">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Files</p>
                        <p className="text-2xl font-bold text-slate-900">{dataset.files?.length || 0}</p>
                    </div>
                </div>

                <Link to={`/dataset/${dataset.id}/compliance`} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="p-4 bg-emerald-50 rounded-xl mr-4 text-emerald-600">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Compliance Score</p>
                        <p className={`text-2xl font-bold ${scoreColor}`}>
                            {report ? `${report.overallScore}/100` : 'Evaluating...'}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View detailed report &rarr;</p>
                    </div>
                </Link>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center">
                    <div className="p-4 bg-amber-50 rounded-xl mr-4 text-amber-500">
                        <Play className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Processing Status</p>
                        <p className="text-xl font-bold text-slate-900">{dataset.status}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900">Files & Metadata</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {dataset.files?.map((file) => (
                        <div key={file.id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex mb-4 sm:mb-0">
                                <div className="mt-1 mr-4 rounded-lg bg-white shadow-sm border border-slate-100 p-2 h-10 w-10 flex items-center justify-center shrink-0">
                                    {getFileIcon(file.format)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{file.originalName}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{(file.sizeBytes / 1024).toFixed(1)} KB | {file.format}</p>
                                    {file.metadata?.[0]?.caption && (
                                        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                                            {file.metadata[0].caption}
                                        </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {file.metadata?.[0]?.tags?.map((tag, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {file.metadata?.[0]?.objects?.length > 0 && (
                                        <p className="mt-3 text-xs text-slate-500">
                                            Objects: {file.metadata[0].objects.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {file.metadata?.[0]?.sensitiveFlags?.length > 0 && (
                                <div className="sm:text-right shrink-0">
                                    <p className="text-xs font-semibold text-amber-600 mb-1">Flags Detected</p>
                                    <div className="flex sm:justify-end flex-wrap gap-1">
                                        {file.metadata[0].sensitiveFlags.map((flag, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                {flag.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {dataset.files?.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No files uploaded.</div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900">Compliance Snapshot</h3>
                </div>
                <div className="p-6">
                    {topViolations.length > 0 ? (
                        <ul className="space-y-3">
                            {topViolations.slice(0, 3).map((violation, idx) => (
                                <li key={idx} className="text-sm text-slate-700">
                                    {violation.issue}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No active compliance violations.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatasetDetailPage;
