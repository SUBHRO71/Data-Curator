import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDataset } from '../services/api';
import { UploadCloud, File, X, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const UploadPage = () => {
    const navigate = useNavigate();
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [datasetName, setDatasetName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (newFiles) => {
        setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    };

    const removeFile = (idx) => {
        setFiles(files.filter((_, i) => i !== idx));
    };

    const submitUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        // fake progress
        const interval = setInterval(() => {
            setUploadProgress(p => p < 90 ? p + 10 : 90);
        }, 300);

        try {
            await uploadDataset(datasetName, files);
            clearInterval(interval);
            setUploadProgress(100);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error(error);
            clearInterval(interval);
            setUploadProgress(0);
            setUploading(false);
            alert(error.message || "Upload failed. Make sure backend is running.");
        }
    };

    return (
        <div className="py-6 max-w-4xl mx-auto w-full fade-in">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Upload Dataset</h1>
            <p className="text-slate-500 mb-8 text-sm">Upload images, text documents, audio, or video files for metadata tagging and compliance checking.</p>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Dataset Name</label>
                    <input 
                        type="text" 
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        placeholder="e.g. Faces In The Wild v2"
                        className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 transition-colors bg-slate-50"
                    />
                </div>

                <div 
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors mb-6",
                        dragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-300 bg-slate-50/50 hover:bg-slate-100"
                    )}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                >
                    <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
                    <UploadCloud className={cn("w-14 h-14 mb-4 transition-colors", dragActive ? "text-indigo-500" : "text-slate-400")} />
                    <p className="text-base text-slate-600 font-medium mb-1"><span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => inputRef.current?.click()}>Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-400">SVG, PNG, JPG, JSON, CSV, MP4, MP3 (MAX 50MB)</p>
                </div>

                {files.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
                            Selected Files ({files.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center overflow-hidden">
                                        <div className="p-2 bg-slate-100 rounded mr-3">
                                            <File className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="truncate pr-4">
                                            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFile(idx)} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors flex-shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {uploading ? (
                    <div className="mt-8">
                        <div className="flex justify-between text-sm font-semibold mb-2">
                            <span className="text-indigo-600 flex items-center">
                                {uploadProgress === 100 ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-2"></div>}
                                {uploadProgress === 100 ? 'Upload Complete' : 'Uploading & Processing...'}
                            </span>
                            <span className="text-slate-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end border-t border-slate-100 pt-6 mt-2">
                        <button 
                            disabled={files.length === 0}
                            onClick={submitUpload}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-2",
                                files.length > 0 ? "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-600" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            Upload and Process
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPage;
