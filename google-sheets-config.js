/**
 * Google Sheets API Configuration
 * Replaces firebase-config.js as the data backend.
 * 
 * The API URL is stored in localStorage after migration.
 * To use Google Sheets, localStorage["backendType"] must be "google-sheets".
 */

const GOOGLE_SHEETS_API_URL = (function() {
  // Try localStorage first (set during migration)
  try {
    const url = localStorage.getItem('googleSheetsApiUrl');
    if (url && url.length > 10) return url;
  } catch (e) {}

  // Fallback: hardcode the URL here after deploying Apps Script
  return 'https://script.google.com/macros/s/AKfycbyARek0MXJX60wTSsrm5kOelyC7F4XnIpL7L38oSQHMyzIVQPPkwkXm3qnSzG680jpw/exec';

  // Example: return 'https://script.google.com/macros/s/AKfycbxxxxxxxx/exec';
})();

/**
 * Check if we should use Google Sheets backend
 * Now always returns true — Google Sheets is the primary backend.
 * Firebase is kept as code backup only (not used).
 */
function useGoogleSheets() {
  return true;
}

/**
 * Google Sheets API client
 */
const sheetsAPI = {
  /**
   * Load all data from Google Sheets
   */
  async loadData() {
    const url = GOOGLE_SHEETS_API_URL + '?action=loadData';
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Load failed');
    return json.data;
  },

  /**
   * Save all data to Google Sheets (full overwrite)
   */
  async saveData(data) {
    const resp = await fetch(GOOGLE_SHEETS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveData', data: data })
    });
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Save failed');
    return json;
  },

  /**
   * Delete all data from Google Sheets
   */
  async deleteAll() {
    const resp = await fetch(GOOGLE_SHEETS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'deleteAll' })
    });
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Delete failed');
    return json;
  },

  /**
   * Get record counts
   */
  async getCounts() {
    const resp = await fetch(GOOGLE_SHEETS_API_URL + '?action=count');
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Count failed');
    return json.counts;
  }
};

console.log('Google Sheets API configured:', GOOGLE_SHEETS_API_URL ? 'URL set' : 'URL not set');