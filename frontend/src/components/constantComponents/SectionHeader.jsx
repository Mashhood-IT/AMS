import React from 'react';

const SectionHeader = ({ title, subtitle, button }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 px-1">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-tight mt-1 break-words">{subtitle}</p>}
        </div>
        {button && (
          <div className="flex items-center w-full sm:w-auto sm:justify-end shrink-0">
            {button}
          </div>
        )}
      </div>
      <hr className="border-slate-200" />
    </div>
  );
};

export default SectionHeader;
