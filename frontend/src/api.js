// api.js

// Simulated in-memory database
let datasets = [
  { id: 'ds_101', name: 'Regional Medical X-Rays', domain: 'healthcare', status: 'draft', score: 85, modalities: ['image'] },
  { id: 'ds_102', name: 'Tamil Audio Commands', domain: 'regional_language', status: 'validated', score: 92, modalities: ['audio'] }
];

let items = {
  'ds_101': [
    { id: 'item_1', type: 'image', url: 'https://via.placeholder.com/150', metadata: { patient_age: '45', body_part: 'Chest' }, validation: { status: 'valid', errors: [] } },
    { id: 'item_2', type: 'image', url: 'https://via.placeholder.com/150', metadata: { patient_age: '30', body_part: null }, validation: { status: 'invalid', errors: ['Missing body_part'] } }
  ]
};

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- Datasets ---
  getDatasets: async () => {
    await delay(300);
    return datasets;
  },
  createDataset: async (data) => {
    await delay(300);
    const newDs = { id: `ds_${Date.now()}`, ...data, status: 'draft', score: 0, modalities: [] };
    datasets.push(newDs);
    items[newDs.id] = [];
    return newDs;
  },
  getDataset: async (id) => {
    await delay(200);
    return datasets.find(d => d.id === id);
  },

  // --- Metadata Schemas (Patent Feature: Adaptive Schema) ---
  getMetadataSchema: async (domain) => {
    await delay(200);
    if (domain === 'healthcare') return { fields: ['patient_age', 'body_part', 'anonymized'] };
    if (domain === 'agriculture') return { fields: ['crop_type', 'geo_location', 'disease_present'] };
    return { fields: ['language', 'dialect', 'source'] };
  },

  // --- Items ---
  getItems: async (datasetId) => {
    await delay(200);
    return items[datasetId] || [];
  },
  getItem: async (datasetId, itemId) => {
    await delay(100);
    return items[datasetId]?.find(i => i.id === itemId);
  },
  updateMetadata: async (datasetId, itemId, metadata) => {
    await delay(200);
    const item = items[datasetId].find(i => i.id === itemId);
    if (item) item.metadata = { ...item.metadata, ...metadata };
    return item;
  },
  
  // --- Ingestion & Validation ---
  ingestItems: async (datasetId, files) => {
    await delay(500);
    // Simulate Normalization Engine
    const newItems = files.map(f => ({
      id: `item_${Date.now()}_${Math.random()}`,
      type: f.type.split('/')[0],
      url: URL.createObjectURL(f),
      metadata: {},
      validation: { status: 'pending', errors: [] }
    }));
    items[datasetId] = [...(items[datasetId] || []), ...newItems];
    return newItems;
  },
  
  validateItem: async (datasetId, itemId) => {
    await delay(300);
    const item = items[datasetId].find(i => i.id === itemId);
    // Simple rule mock: Must have some metadata
    const hasErrors = Object.keys(item.metadata).length === 0 || Object.values(item.metadata).some(v => !v);
    item.validation = hasErrors 
      ? { status: 'invalid', errors: ['Missing required metadata fields'] } 
      : { status: 'valid', errors: [] };
    return item.validation;
  },

  // --- Export ---
  exportDataset: async (datasetId, format) => {
    await delay(1000);
    const data = items[datasetId];
    if (format === 'json') return JSON.stringify(data, null, 2);
    // Mock CSV conversion
    if (format === 'csv') return "id,type,metadata\n" + data.map(i => `${i.id},${i.type},${JSON.stringify(i.metadata)}`).join("\n");
    return "";
  }
};