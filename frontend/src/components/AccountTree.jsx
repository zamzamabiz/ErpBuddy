import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function AccountTree({ accounts, onSelectAccount, selectedAccountId }) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderAccountNode = (account, depth = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedIds.has(account._id);
    const isSelected = selectedAccountId === account._id;

    return (
      <div key={account._id}>
        <div
          style={{ paddingLeft: `${depth * 16}px` }}
          className={`py-2 px-4 flex items-center hover:bg-blue-50 cursor-pointer rounded transition ${
            isSelected ? 'bg-blue-100 border-l-4 border-blue-600' : ''
          }`}
          onClick={() => onSelectAccount(account)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(account._id);
              }}
              className="mr-2 hover:bg-gray-200 rounded p-1"
            >
              {isExpanded ? (
                <ChevronDown size={18} className="text-gray-600" />
              ) : (
                <ChevronRight size={18} className="text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-blue-600">{account.code}</span>
              <span className="text-gray-700">{account.name}</span>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded capitalize">
                {account.type}
              </span>
            </div>
            {account.description && (
              <div className="text-xs text-gray-500 ml-0 mt-1">{account.description}</div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="pl-4 border-l-2 border-gray-200">
            {account.children.map(child => renderAccountNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Chart of Accounts</h3>
      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No accounts created yet</div>
      ) : (
        <div className="space-y-0">
          {accounts.map(account => renderAccountNode(account))}
        </div>
      )}
    </div>
  );
}
