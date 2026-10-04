import { requireAuth, logout } from './auth.js';
import { fetchReport, addExpense, fileToBase64 } from './api.js';

const user = requireAuth();

if (user) {
  document.getElementById("userGreeting").innerText = `${user.email} (${user.role})`;
  document.getElementById("logoutBtn").addEventListener("click", logout);

  if (user.role === "Contractor") {
    // Hide financials and expense entry form for contractors
    const budgetSec = document.getElementById("budgetSection");
    const expenseFormCard = document.getElementById("expenseFormCard");
    const expenseListCard = document.getElementById("expenseListCard");
    if (budgetSec) budgetSec.classList.add("hidden");
    if (expenseFormCard) expenseFormCard.classList.add("hidden");
    if (expenseListCard) expenseListCard.classList.add("hidden");
  }

  init();
}

async function init() {
  await loadDashboard();
  setupExpenseForm();
}

async function loadDashboard() {
  const refreshIcon = document.getElementById("refreshIcon");
  if (refreshIcon) refreshIcon.classList.add("animate-spin");

  try {
    const data = await fetchReport(user.passcode);
    renderMetrics(data.expenses || []);
    renderExpenses(data.expenses || []);
    renderTasks(data.tasks || []);
  } catch (err) {
    alert("Could not load dashboard: " + err.message);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove("animate-spin");
  }
}

function renderMetrics(expenses) {
  if (user.role === "Contractor") return; 

  const totalActual = expenses.reduce((sum, item) => sum + (Number(item.ActualCost) || 0), 0); 
  const totalEstimated = expenses.reduce((sum, item) => sum + (Number(item.EstimatedCost) || 0), 0); 
  const variance = totalEstimated - totalActual; 

  // Uses 'en-IN' to format into lakhs and crores (e.g. ₹1,50,000.00)
  document.getElementById("metricActual").innerText = `₹${totalActual.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("metricEstimated").innerText = `₹${totalEstimated.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const varEl = document.getElementById("metricVariance"); 
  varEl.innerText = `₹${Math.abs(variance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  varEl.className = `text-2xl font-bold ${variance >= 0 ? "text-emerald-600" : "text-rose-600"}`; 
  document.getElementById("varianceSubtitle").innerText = variance >= 0 ? "Under estimated" : "Over estimated"; 
}

function renderExpenses(expenses) {
  const tbody = document.getElementById("expenseList");
  if (!tbody) return;

  if (expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-400">No expenses recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr class="hover:bg-gray-50 transition border-b">
      <td class="p-3 text-xs font-mono text-gray-500">${e.ID || '-'}</td>
      <td class="p-3 font-medium text-gray-900">${e.Description || '-'}</td>
      <td class="p-3 text-sm text-gray-600"><span class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">${e.Room || '-'}</span></td>
      <td class="p-3 font-semibold text-gray-900">₹${(Number(e.ActualCost) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td class="p-3">
        ${e.ReceiptLink 
          ? `<a href="${e.ReceiptLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs font-semibold">
               <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
               View Receipt
             </a>` 
          : `<span class="text-xs text-gray-400 italic">No receipt</span>`}
      </td>
    </tr>
  `).join("");
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  if (!list) return;

  if (tasks.length === 0) {
    list.innerHTML = `<p class="p-6 text-center text-gray-400">No tasks currently scheduled.</p>`;
    return;
  }

  list.innerHTML = tasks.map(t => {
    const isDone = (t.Status || "").toLowerCase() === "done" || (t.Status || "").toLowerCase() === "completed";
    return `
      <div class="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 text-sm truncate ${isDone ? 'line-through text-gray-400' : ''}">${t.Task}</p>
          <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>📍 ${t.Room || 'General'}</span>
            <span>•</span>
            <span>👤 ${t.AssignedTo || 'Unassigned'}</span>
            ${t.DueDate ? `<span>•</span><span>📅 ${t.DueDate}</span>` : ''}
          </div>
        </div>
        <span class="text-xs px-2.5 py-1 rounded-full font-medium ${
          isDone ? 'bg-emerald-100 text-emerald-800' :
          (t.Status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700')
        }">
          ${t.Status || 'Pending'}
        </span>
      </div>
    `;
  }).join("");
}

function setupExpenseForm() {
  const form = document.getElementById("expenseForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("saveExpenseBtn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Uploading & Saving...`;

    try {
      const fileInput = document.getElementById("receiptInput");
      let receiptFile = null;

      if (fileInput.files.length > 0) {
        receiptFile = await fileToBase64(fileInput.files[0]);
      }

      const payload = {
        description: document.getElementById("expenseDesc").value.trim(),
        room: document.getElementById("expenseRoom").value.trim(),
        category: document.getElementById("expenseCategory").value.trim(),
        estimatedCost: parseFloat(document.getElementById("expenseEst").value) || 0,
        actualCost: parseFloat(document.getElementById("expenseAct").value) || 0,
        status: document.getElementById("expenseStatus").value,
        receiptFile: receiptFile
      };

      await addExpense(payload, user.passcode);
      form.reset();
      await loadDashboard();
      alert("Expense logged and receipt stored successfully!");
    } catch (err) {
      alert("Failed to submit expense: " + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `Save Expense & Upload Receipt`;
    }
  });

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadDashboard);
}
