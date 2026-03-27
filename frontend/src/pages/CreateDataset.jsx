import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export const CreateDataset = () => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('healthcare');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newDs = await api.createDataset({ name, domain });
    // Redirect to ingestion page immediately
    navigate(`/dataset/${newDs.id}/ingest`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Dataset</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Dataset Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Regional Corn Disease Images"
              required
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">Domain Context</label>
            <select
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="healthcare">Healthcare (HIPAA Focus)</option>
              <option value="agriculture">Agriculture (Regional Focus)</option>
              <option value="regional_language">Regional Language (NLP Focus)</option>
              <option value="accessibility">Accessibility (WCAG Focus)</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">Selecting a domain triggers the Adaptive Metadata Engine.</p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Initializing Schema...' : 'Create Dataset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};