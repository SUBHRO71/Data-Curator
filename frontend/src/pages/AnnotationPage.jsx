import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDataset, updateTags } from '../services/api';
import { ArrowLeft, Save, Tag } from 'lucide-react';

const AnnotationPage = () => {
    const { id } = useParams();
    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // State to hold local edits before saving
    const [editors, setEditors] = useState({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const data = await getDataset(id);
            setDataset(data);
            
            // initialize editors state
            const initialEditors = {};
            data.files.forEach(f => {
                if (f.metadata && f.metadata[0]) {
                    initialEditors[f.metadata[0].id] = f.metadata[0].tags.join(', ');
                }
            });
            setEditors(initialEditors);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSave = async (metadataId) => {
        try {
            const rawTags = editors[metadataId];
            const tagsArray = rawTags.split(',').map(t => t.trim()).filter(t => t);
            
            await updateTags(metadataId, tagsArray);
            
            alert('Tags updated successfully!');
            fetchData(); // Refresh UI
        } catch (error) {
            console.error(error);
            alert('Failed to update tags');
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!dataset) return <div className="p-6">Dataset not found</div>;

    return (
        <div className="py-6 w-full max-w-4xl mx-auto fade-in pb-16">
            <Link to={`/dataset/${id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dataset
            </Link>

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Annotation Override</h1>
                    <p className="text-slate-500 mt-1 text-sm">Review, adjust, or add missing tags to improve dataset quality.</p>
                </div>
            </div>

            <div className="space-y-6">
                {dataset.files?.map(file => {
                    const metaId = file.metadata?.[0]?.id;
                    if (!metaId) return null;
                    
                    return (
                        <div key={file.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-start gap-6">
                            <div className="w-full md:w-1/3">
                                <h3 className="text-sm font-bold text-slate-900 truncate mb-1">{file.originalName}</h3>
                                <p className="text-xs text-slate-500 mb-4">{file.format} • {(file.sizeBytes / 1024).toFixed(1)} KB</p>
                                
                                {file.format === 'IMAGE' && (
                                    <div className="w-full aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                        <span className="text-xs text-slate-400">Media Preview</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full md:w-2/3 flex flex-col justify-between">
                                <div>
                                    <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
                                        <Tag className="w-3 h-3 mr-1" /> Meta Tags (comma separated)
                                    </label>
                                    <textarea
                                        value={editors[metaId] || ''}
                                        onChange={(e) => setEditors({ ...editors, [metaId]: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow resize-none"
                                    />
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleSave(metaId)}
                                        className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Save className="w-4 h-4 mr-1.5" /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnnotationPage;
