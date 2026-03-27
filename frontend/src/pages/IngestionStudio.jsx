import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export const IngestionStudio = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, done

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploadStatus('uploading');
    // Simulating the Normalization Engine
    await api.ingestItems(datasetId, files);
    
    setUploadStatus('done');
    setFiles([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Multi-Modal Ingestion Engine</h2>
        <p className="text-sm text-gray-500 mb-4">
          System will auto-normalize heterogeneous files (Text, Image, Audio) into a unified schema.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-indigo-400 transition-colors">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Drag & drop files, or <label className="text-indigo-600 cursor-pointer hover:underline"><input type="file" className="sr-only" multiple onChange={handleFileChange} />browse</label>
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, WAV, MP3, CSV, JSON up to 10MB</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({files.length})</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-40 overflow-y-auto">
              {files.map((file, idx) => (
                <li key={idx} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-indigo-600">{file.name}</span>
                  <span className="ml-4 flex-shrink-0 text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={() => navigate(`/dataset/${datasetId}/curate`)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Skip
          </button>
          <button 
            onClick={handleUpload} 
            disabled={uploadStatus === 'uploading'}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
          >
            {uploadStatus === 'uploading' ? 'Normalizing...' : 'Upload & Normalize'}
          </button>
        </div>
        
        {uploadStatus === 'done' && (
           <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
             <p className="text-sm text-green-700 font-medium">Ingestion Complete. Schema normalized.</p>
           </div>
        )}
      </div>
    </div>
  );
};