import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export const CurationWorkbench = () => {
  const { datasetId } = useParams();
  const [dataset, setDataset] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [schema, setSchema] = useState({ fields: [] });
  const [validationResult, setValidationResult] = useState(null);

  // Load Dataset and Items
  useEffect(() => {
    api.getDataset(datasetId).then(setDataset);
    api.getItems(datasetId).then(setItems);
  }, [datasetId]);

  // Load Adaptive Schema based on Domain
  useEffect(() => {
    if (dataset?.domain) {
      api.getMetadataSchema(dataset.domain).then(setSchema);
    }
  }, [dataset]);

  const handleMetaChange = (field, value) => {
    // Optimistic update
    setSelectedItem((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
    }));
  };

  const saveMetadata = async () => {
    await api.updateMetadata(datasetId, selectedItem.id, selectedItem.metadata);
    alert('Metadata Saved');
  };

  const runValidation = async () => {
    const result = await api.validateItem(datasetId, selectedItem.id);
    setValidationResult(result);
    // Update item list to reflect status
    setItems(items.map((i) => (i.id === selectedItem.id ? { ...i, validation: result } : i)));
  };

  if (!dataset) return <div>Loading...</div>;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Sidebar: Item List */}
      <aside className="w-96 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200 bg-white">
          <h2 className="font-bold text-2xl text-gray-900">{dataset.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{items.length} items</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                setValidationResult(null);
              }}
              className={`w-full text-left p-4 rounded-lg border ${selectedItem?.id === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-gray-500 truncate">{item.id}</span>
                {item.validation.status === 'invalid' && (
                  <span className="block h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-300" title="Invalid" />
                )}
                {item.validation.status === 'valid' && (
                  <span className="block h-3 w-3 rounded-full bg-green-500 ring-2 ring-green-300" title="Valid" />
                )}
              </div>
              <span className="block mt-2 text-lg font-medium capitalize">{item.type} Data</span>
            </button>
          ))}
        </div>
        <div className="p-5 border-t bg-white">
          <a
            href={`/dataset/${datasetId}/export`}
            className="block w-full text-center px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-base font-semibold"
          >
            Proceed to Export
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white">
        {selectedItem ? (
          <>
            {/* Viewer */}
            <div className="flex-1 flex items-center justify-center bg-gray-100 border-b">
              {selectedItem.type === 'image' && (
                <img src={selectedItem.url} alt="Preview" className="max-h-80 object-contain shadow-lg" />
              )}
              {selectedItem.type === 'audio' && (
                <div className="p-5 bg-white rounded shadow">
                  <p className="font-mono text-base mb-2">Audio Simulation</p>
                  <div className="w-72 h-10 bg-gray-300 rounded"></div>
                </div>
              )}
            </div>

            {/* Metadata & Validation Panel */}
            <div className="w-full max-w-2xl mx-auto p-8 space-y-7 overflow-y-auto">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-5">Contextual Metadata</h3>
                <div className="space-y-4">
                  {schema.fields.map((field) => (
                    <div key={field}>
                      <label className="block text-base font-medium text-gray-700 capitalize mb-2">
                        {field.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedItem.metadata[field] || ''}
                        onChange={(e) => handleMetaChange(field, e.target.value)}
                        placeholder={`Enter ${field}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  onClick={saveMetadata}
                  className="flex-1 py-3 px-5 border border-gray-300 rounded-md shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50"
                >
                  Save Metadata
                </button>
                <button
                  onClick={runValidation}
                  className="flex-1 py-3 px-5 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Validate Item
                </button>
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div
                  className={`p-5 rounded-md ${validationResult.status === 'valid' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <h4 className={`font-bold text-base ${validationResult.status === 'valid' ? 'text-green-800' : 'text-red-800'}`}>
                    Validation: {validationResult.status.toUpperCase()}
                  </h4>
                  {validationResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p className="text-xl">Select an item from the list to begin curation</p>
          </div>
        )}
      </main>
    </div>
  );
};
