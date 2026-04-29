import React from 'react';

const SectionHeader = ({ title, subtitle, button }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">{subtitle}</p>}
        </div>
        {button && (
          <div className="flex items-center">
            {button}
          </div>
        )}
      </div>
      <hr className="border-slate-200" />
    </div>
  );
};

export default SectionHeader;
