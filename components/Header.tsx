
import React, { useState } from 'react';
import { EarthIcon, EnergyIcon, InfoIcon, FolderIcon } from './Icons';

interface HeaderProps {
  onToggleGuide: () => void;
  onToggleProjects: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

const Header: React.FC<HeaderProps> = ({ onToggleGuide, onToggleProjects, saveStatus }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <header className="text-center relative">
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <EarthIcon className="w-10 h-10 text-green-500" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
          Green Energy Analyzer
        </h1>
        <EnergyIcon className="w-10 h-10 text-green-500" />
      </div>
      <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
        Discover your potential for renewable energy. Answer a few questions to get a personalized, AI-powered analysis for your home, community, or region.
      </p>
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline transition-opacity duration-300">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}
        </span>
        <button
          onClick={onToggleProjects}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          aria-label="Open my projects"
        >
          <FolderIcon className="w-5 h-5" />
          <span className="hidden sm:inline">My Projects</span>
        </button>
        <button
          onClick={onToggleGuide}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          aria-label="Open user guide"
        >
          <InfoIcon className="w-5 h-5" />
          <span className="hidden sm:inline">User Guide</span>
        </button>
         {/* Mock Login */}
        <button
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          {isLoggedIn ? 'Log Out' : 'Log In'}
        </button>
      </div>
    </header>
  );
};

export default Header;
