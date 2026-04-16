import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';

/**
 * Individual account node in the tree
 * Handles expand/collapse and recursive rendering
 */
const AccountNode = ({ account, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(level <= 1);

  const hasChildren = account.children && account.children.length > 0;
  const isSelectable = account.allowPosting === true;
  const isParent = !account.allowPosting;

  const handleSelect = () => {
    if (isSelectable && onSelect) {
      onSelect(account);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  // Build className strings
  const containerClass = isSelectable 
    ? 'cursor-pointer hover:bg-slate-100 active:bg-slate-200' 
    : 'cursor-default';
  const textColorClass = isParent ? 'text-slate-700' : 'text-slate-900';

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded transition-colors ${containerClass} ${textColorClass}`}
        style={{ marginLeft: `${level * 1.5}rem` }}
        onClick={handleSelect}
      >
        {/* Toggle Button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0 hover:bg-slate-200 rounded"
            type="button"
          >
            {isExpanded ? (
              <ChevronDown size={18} className="text-slate-600" />
            ) : (
              <ChevronRight size={18} className="text-slate-600" />
            )}
          </button>
        ) : (
          <div className="w-6"></div>
        )}

        {/* Icon */}
        {hasChildren ? (
          <Folder size={18} className="text-slate-400 flex-shrink-0" />
        ) : (
          <FileText size={18} className="text-slate-300 flex-shrink-0" />
        )}

        {/* Account Code and Name */}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-sm mr-2 ${isParent ? 'font-semibold text-slate-700' : 'font-medium text-slate-800'}`}>
            [{account.code}]
          </span>
          <span className={`${isParent ? 'font-semibold text-slate-700' : 'text-slate-700'}`}>
            {account.name}
          </span>
        </div>

        {/* Type Badge */}
        {account.type && (
          <span className="flex-shrink-0 text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
            {account.type}
          </span>
        )}
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div>
          {account.children.map((child) => (
            <AccountNode
              key={child._id || child.code}
              account={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountNode;
