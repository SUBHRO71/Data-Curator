import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { exportDataset, resolveApiUrl } from '../services/api';
import { Download, ArrowLeft, FileJson, FileSpreadsheet } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ExportPage = () => {
    const { id } = useParams();
    const [format, setFormat] = useState('json');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const { downloadUrl } = await exportDataset(id, format);
            
            // Create an invisible iframe/link to trigger the download from the backend endpoint
            const url = resolveApiUrl(downloadUrl);
            const windowOpen = window.open(url, '_blank');
            if(!windowOpen) {
                 const link = document.createElement('a');
                 link.href = url;
                 link.setAttribute('download', '');
                 document.body.appendChild(link);
                 link.click();
                 link.remove();
            }
            
            setExporting(false);
        } catch (error) {
            console.error(error);
            alert('Failed to generate export bundle');
            setExporting(false);
        }
    };

    return (
        <div className="py-6 max-w-3xl mx-auto w-full fade-in pb-16">
            <Link to={`/dataset/${id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dataset
            </Link>

            <div className="mb-10 text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex justify-center items-center mb-4 border border-indigo-100">
                    <Download className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Export Pipeline</h1>
                <p className="text-slate-500 mt-2">Generate clean ML-ready annotations in your preferred format.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Select Export Format</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div 
                        onClick={() => setFormat('json')}
                        className={cn(
                            "cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center justify-center transition-all",
                            format === 'json' ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
                        )}
                    >
                        <FileJson className={cn("w-10 h-10 mb-3", format === 'json' ? "text-indigo-600" : "text-slate-400")} />
                        <span className={cn("font-bold", format === 'json' ? "text-indigo-900" : "text-slate-600")}>Hierarchical JSON</span>
                        <span className="text-xs text-slate-500 mt-1 text-center">Best for nested object tracking and complex boundaries.</span>
                    </div>

                    <div 
                        onClick={() => setFormat('csv')}
                        className={cn(
                            "cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center justify-center transition-all",
                            format === 'csv' ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
                        )}
                    >
                        <FileSpreadsheet className={cn("w-10 h-10 mb-3", format === 'csv' ? "text-indigo-600" : "text-slate-400")} />
                        <span className={cn("font-bold", format === 'csv' ? "text-indigo-900" : "text-slate-600")}>Flat CSV</span>
                        <span className="text-xs text-slate-500 mt-1 text-center">Optimized for Pandas and traditional ML tabular pipelines.</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6">
                    <p className="text-sm text-slate-500 mb-4 sm:mb-0">Pipeline will include all sanitized metadata and files.</p>
                    <button 
                        onClick={handleExport}
                        disabled={exporting}
                        className={cn(
                            "w-full sm:w-auto flex justify-center items-center px-8 py-3 rounded-lg text-sm font-bold text-white shadow-md transition-all",
                            exporting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                        )}
                    >
                        {exporting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating Bundle...
                            </>
                        ) : (
                            <>Generate & Download</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportPage;
