/**
 * API layer communicating with Google Apps Script Web App
 */

// REPLACE with your deployed Google Apps Script Web App URL
export const API_URL = "https://script.google.com/macros/s/AKfycbxuv6LdlPE_xdXg5K5Ko223FXnJ6R27m0kbQyS_Pbo6e5qzXrGccJPzl3yMgxs5JuY6/exec";

/**
 * Fetch project report (expenses, tasks, user info)
 */
export async function fetchReport(passcode) {
  console.log(API_URL);
  
  const url = `${API_URL}?action=getReport&passcode=${encodeURIComponent(passcode)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 200) {
    throw new Error(json.data?.error || "Failed to load project report");
  }
  return json.data;
}

/**
 * Submit an expense with optional Base64 receipt to Google Drive
 */
export async function addExpense(expenseData, passcode) {
  const payload = {
    action: "addExpense",
    passcode,
    ...expenseData
  };

  // Google Apps Script requires text/plain to avoid CORS preflight OPTIONS failure
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (json.status !== 200) {
    throw new Error(json.data?.error || "Failed to add expense");
  }
  return json.data;
}

/**
 * Convert browser File object to Base64 data with MIME type
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({
      base64: reader.result,
      mimeType: file.type || "application/octet-stream",
      filename: file.name
    });
    reader.onerror = (error) => reject(error);
  });
}
