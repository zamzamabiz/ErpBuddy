# STEP 14 — ACCOUNT UI (TREE + SELECTOR) ✅ COMPLETE

## Overview
Frontend Chart of Accounts module with hierarchical tree view and reusable account selector component for form integration across Sales, Purchase, Journal, and Payment flows.

---

## 📁 File Structure Created

```
frontend/src/modules/accounts/
├── index.js                      # Module exports
├── services/
│   └── accountService.js         # API layer (getAccountTree, getAccounts, etc.)
├── components/
│   ├── AccountNode.jsx           # Individual tree node (recursive)
│   ├── AccountTree.jsx           # Main tree view container
│   └── AccountSelector.jsx       # Reusable dropdown selector (for forms)
└── pages/
    └── AccountsPage.jsx          # Main page (tree + details panel)
```

---

## 🧩 Components Summary

### 1. **accountService.js** (Services Layer)
**Location**: `frontend/src/modules/accounts/services/accountService.js`

Functions provided:
```javascript
✓ getAccountTree()              // Fetch tree structure from /api/accounts/tree
✓ getAccounts(params)           // Fetch filtered accounts from /api/accounts?...
✓ getAccountsByType(type)       // Filter by type (asset, liability, etc.)
✓ getPostingAccounts()          // Get only leaf accounts (allowPosting=true)
✓ getAccountById(id)            // Fetch single account by ID
```

**Usage**:
```javascript
import { getAccountTree, getPostingAccounts } from '../services/accountService';

const tree = await getAccountTree();
const postingAccounts = await getPostingAccounts();
```

---

### 2. **AccountNode.jsx** (Tree Node Component)
**Location**: `frontend/src/modules/accounts/components/AccountNode.jsx`

**Features**:
- ✓ Recursive rendering for hierarchical display
- ✓ Expand/collapse toggle for parent nodes
- ✓ Folder icon for parents, File icon for leaves
- ✓ Format: `[CODE] Name`
- ✓ Only leaf accounts (allowPosting=true) are selectable
- ✓ Auto-expand first 2 levels
- ✓ Indentation based on level

**Props**:
```javascript
<AccountNode 
  account={accountObj}      // Account object with children array
  level={0}                 // Hierarchy level (for indentation)
  onSelect={callback}       // Fired when leaf account clicked
/>
```

**Styling**:
- Parent accounts: Bold text, not clickable (disabled cursor)
- Leaf accounts: Normal text, clickable (hover effect)
- Selected: Highlighted background
- Icons: Tailwind + lucide-react icons

---

### 3. **AccountTree.jsx** (Main Tree Component)
**Location**: `frontend/src/modules/accounts/components/AccountTree.jsx`

**Features**:
- ✓ Fetches tree from `/api/accounts/tree` on mount
- ✓ Handles loading/error states
- ✓ Recursive node rendering
- ✓ Selection callback
- ✓ Development debug info panel

**Props**:
```javascript
<AccountTree 
  onSelectAccount={callback}    // Called when leaf account selected
  readOnly={true}               // Disable selection mode
  className="custom-class"      // Custom CSS classes
/>
```

**States Handled**:
- Loading: Spinner animation
- Error: Red error box
- Empty: "No accounts available"
- Success: Full tree rendered with expand/collapse

---

### 4. **AccountSelector.jsx** (Reusable Form Component) ⭐
**Location**: `frontend/src/modules/accounts/components/AccountSelector.jsx`

**Purpose**: Searchable dropdown for selecting posting accounts in:
- Sales/Purchase/Journal lines
- Payment/Receipt selection
- Form-based account choosing

**Features**:
- ✓ Searchable by code, name, or type
- ✓ Shows only leaf accounts (allowPosting=true)
- ✓ Dropdown with filtered results
- ✓ Search box with icons
- ✓ Selected value display
- ✓ Clear button (X)
- ✓ Error message support
- ✓ Disabled state support
- ✓ Shows account type + normal balance info

**Props**:
```javascript
<AccountSelector 
  value={selectedAccount}        // Selected account object
  onChange={callback}            // Fired on selection (receives account)
  placeholder="Select Account"  // Placeholder text
  label="Debit Account"         // Form label
  error="Invalid selection"     // Error message
  disabled={false}              // Disable input
  className="w-full"            // Custom CSS
/>
```

**Display Format**:
```
[50020301] Electricity
Expense • Debit     (type + normal balance)
```

**Usage Example**:
```javascript
import { AccountSelector } from '../modules/accounts';

const [account, setAccount] = useState(null);

<AccountSelector 
  value={account}
  onChange={setAccount}
  label="Expense Account"
/>
```

---

### 5. **AccountsPage.jsx** (Main Page)
**Location**: `frontend/src/modules/accounts/pages/AccountsPage.jsx`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Chart of Accounts (Header)                      │
├──────────────────────────┬──────────────────────┤
│                          │                      │
│  Account Tree (Left)     │  Details Panel (Rig) │
│  - Hierarchical view     │  - Selected account  │
│  - Expand/collapse       │  - Code, name, type │
│  - Indented by level     │  - Balance info      │
│                          │  - Posting status    │
│                          │                      │
└──────────────────────────┴──────────────────────┘
```

**Features**:
- ✓ Left panel: Full chart of accounts tree
- ✓ Right panel: Details of selected account
- ✓ Sticky details panel (stays visible while scrolling)
- ✓ Beautiful header with icon
- ✓ Responsive grid layout

**Details Shown**:
- Code
- Name
- Type (asset, liability, etc.)
- Level (1-4)
- Normal Balance
- Allow Posting (Yes/No badge)
- Category
- Description
- Current Balance

---

## 🎨 UI/UX Design

### Colors & Styling
- **Parent Accounts**: Bold, slate-700 (slightly darker)
- **Leaf Accounts**: Normal weight, slate-900 (full black when selectable)
- **Icons**: Tailwind + lucide-react (Folder, FileText, ChevronDown, Search, X)
- **Hover States**: Light blue background on leaf accounts
- **Selected**: Blue highlight + left border

### Responsive Design
- **Desktop**: 3-column layout (tree on left, details on right)
- **Tablet/Mobile**: Stack into single column

### Accessibility
- ✓ Keyboard navigation via Tab key
- ✓ Clear focus states
- ✓ ARIA labels where needed
- ✓ Error messages visible
- ✓ Disabled states clear

---

## 🔌 Integration Points

### 1. **Sales/Purchase Forms**
```javascript
import { AccountSelector } from '../modules/accounts';

// In Sales line item form:
<AccountSelector 
  label="Sales Account"
  value={lineItem.accountId}
  onChange={(acc) => setLineItem({...lineItem, accountId: acc})}
/>
```

### 2. **Journal Entry**
```javascript
// For debit/credit accounts:
<AccountSelector 
  label="Debit Account"
  value={line.debitAccount}
  onChange={(acc) => setLine({...line, debitAccount: acc})}
/>
```

### 3. **Payments/Receipts**
```javascript
<AccountSelector 
  label="Bank Account"
  value={payment.bankAccount}
  onChange={(acc) => setPayment({...payment, bankAccount: acc})}
/>
```

---

## 📊 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/accounts/tree` | GET | Fetch hierarchical tree structure |
| `/api/accounts` | GET | Fetch filtered accounts |
| `/api/accounts?allowPosting=true` | GET | Fetch only posting-level accounts |
| `/api/accounts?type=asset` | GET | Fetch accounts by type |
| `/api/accounts/:id` | GET | Fetch single account |

---

## 🚀 Performance Optimizations

- ✓ Data fetched only once on component mount
- ✓ useEffect properly dependencies set
- ✓ Recursive rendering efficient (no unnecessary re-renders)
- ✓ First 2 levels auto-expanded (UX)
- ✓ Dropdown filtered client-side (no API calls per keystroke)

---

## 🔒 Security & Governance

- ✓ Read-only for Chart of Accounts (no create/edit buttons)
- ✓ All API calls use existing axios config (auth included)
- ✓ Multi-tenant support (via backend tenant middleware)
- ✓ Parent accounts cannot be selected (enforced in component)
- ✓ Only allowPosting=true accounts in selector

---

## 📋 Route

The following route is wired in `App.jsx`:

```
GET /accounts  →  AccountsPage
```

Sidebar menu already includes "Accounts" link → `/accounts`

---

## ✅ Validation Checklist

- ✓ Tree fetches and renders correctly
- ✓ Parent accounts bold and not selectable
- ✓ Leaf accounts selectable
- ✓ Expand/collapse works recursively
- ✓ Icons display correctly
- ✓ Selector filters by search
- ✓ Selector shows only posting accounts
- ✓ Details panel shows all fields
- ✓ No TypeScript errors
- ✓ Frontend builds successfully
- ✓ Backend API responding
- ✓ Multi-tenant isolation working

---

## 🎯 Next Steps

1. **Sales Module Integration**: Use `AccountSelector` in sales lines
2. **Purchase Module Integration**: Use `AccountSelector` in purchase lines
3. **Journal Entry**: Use `AccountSelector` for debit/credit accounts
4. **Payment Module**: Use for bank account selection
5. **Receipt Module**: Use for bank account selection

---

## 📝 Code Quality

- ✓ Beginner-friendly (no complex patterns)
- ✓ Comments on all components
- ✓ Props clearly documented
- ✓ Error handling throughout
- ✓ Loading states for all async operations
- ✓ Tailwind CSS (no custom CSS needed)
- ✓ lucide-react icons (no SVG imports)

---

**Status**: ✅ COMPLETE & TESTED

**Last Updated**: April 11, 2026  
**Created**: STEP 14 — ACCOUNT UI (TREE + SELECTOR)
