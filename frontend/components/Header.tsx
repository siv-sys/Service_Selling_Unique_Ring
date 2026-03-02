import React from 'react';
import { Bell, Search, Plus, Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  showProvisionButton?: boolean;
  showExportButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showProvisionButton = false,
  showExportButton = false
}) => {
  return (
    <header className="h-20 bg-white border-b border-primary/10 flex items-center justify-between px-8 z-10 sticky top-0">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/30 w-64"
          />
        </div>
        
        <button className="p-2 text-slate-500 hover:bg-primary/5 rounded-full relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        {showExportButton && (
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
        
        {showProvisionButton && (
          <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Provision New Device
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
