# 🏡 Home Renovation Tracker (with Google Sheets & Drive API)

A clean, responsive renovation tracking web application with role-based access control, Google Sheets backend integration, and direct Google Drive receipt/invoice file uploads (photos and PDFs).

---

## 📁 Project Structure

```text
reno-tracker/
├── index.html              # Main dashboard (financials, tasks, expense logging & receipt upload)
├── login.html              # Passcode-gated login screen with role redirection
├── css/
│   └── styles.css          # Custom CSS & polish
├── js/
│   ├── api.js              # Fetch requests to Google Apps Script & base64 conversion
│   ├── auth.js             # Session storage, role validation, route protection
│   └── app.js              # App lifecycle, data rendering, upload handling
├── google-apps-script/
│   └── Code.gs             # Google Apps Script Web App code for Sheets & Drive
└── README.md               # Setup & deployment instructions
```

---

## 🚀 Setup Guide

### Step 1: Create your Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named **"Home Renovation Tracker"**.
2. Create 3 tabs with the following headers in row 1:

#### Tab 1: `AuthorizedUsers`
| Email | Passcode | Role |
| :--- | :--- | :--- |
| `owner@example.com` | `admin123` | `Admin` |
| `partner@example.com` | `home456` | `Partner` |
| `contractor@example.com` | `build789` | `Contractor` |

*(Note: Contractors will not see financials or budget totals, only project tasks).*

#### Tab 2: `Expenses`
| ID | Room | Category | Description | EstimatedCost | ActualCost | Status | PaidDate | ReceiptLink |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `EXP-001` | Kitchen | Cabinets | Shaker Cabinets | 8000 | 7850 | Paid | 2026-10-01 | |

#### Tab 3: `Tasks`
| ID | Room | Task | AssignedTo | Status | DueDate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TSK-101` | Master Bath | Tile Shower Pan | Tile Sub | In Progress | 2026-10-15 |

---

### Step 2: Create Google Drive Receipts Folder
1. Go to [Google Drive](https://drive.google.com).
2. Create a folder named **"Renovation Receipts"**.
3. Copy the **Folder ID** from your browser URL:
   `https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE`

---

### Step 3: Set Up Google Apps Script
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Replace all content in `Code.gs` with the contents of `google-apps-script/Code.gs` in this repository.
3. Replace `YOUR_GOOGLE_DRIVE_FOLDER_ID` at the top of the file with the folder ID from Step 2.
4. Click **Deploy > New Deployment**:
   - Select type: **Web App**
   - Description: `Reno Tracker API v1`
   - Execute as: **Me** (`your-email@gmail.com`)
   - Who has access: **Anyone**
5. Authorize permissions when prompted by Google.
6. Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).

---

### Step 4: Configure Frontend
1. Open `js/api.js`.
2. Replace `YOUR_SCRIPT_ID_HERE` with your actual Web App URL from Step 3.

---

### Step 5: Run Locally or Host Anywhere
Because this is pure vanilla HTML/JS/CSS, you can host it anywhere:
- **Locally**: Run `python -m http.server 8000` or use the VS Code "Live Server" extension.
- **Online**: Deploy instantly to GitHub Pages, Netlify, Vercel, or Cloudflare Pages for free.

Log in using any passcode configured in your `AuthorizedUsers` tab!
