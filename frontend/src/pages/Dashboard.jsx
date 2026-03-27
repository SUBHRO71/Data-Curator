import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export const Dashboard = () => {
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    api.getDatasets().then(setDatasets);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dataset Library</h1>
        <Link to="/create" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          + Create Dataset
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.map((ds) => (
          <div key={ds.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-5 py-6 sm:p-7">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-full uppercase tracking-wide">
                    {ds.domain.replace('_', ' ')}
                  </span>
                  <h3 className="mt-3 text-2xl font-semibold text-gray-900">{ds.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{ds.score}%</div>
                  <div className="text-sm text-gray-500">Health Score</div>
                </div>
              </div>
              
              <div className="mt-5 flex space-x-3">
                <Link to={`/dataset/${ds.id}/curate`} className="flex-1 text-center px-4 py-2.5 border border-gray-300 text-base leading-5 font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Curate
                </Link>
                <Link to={`/dataset/${ds.id}/export`} className="flex-1 text-center px-4 py-2.5 border border-gray-300 text-base leading-5 font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Export
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
