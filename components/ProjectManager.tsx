
import React, { useState } from 'react';
import type { Project, FormData } from '../types';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  currentFormData: FormData;
  onLoadProject: (id: string) => void;
  onSaveNewProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, newName: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen, onClose, projects, activeProjectId, currentFormData,
  onLoadProject, onSaveNewProject, onDeleteProject, onNewProject, onRenameProject
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (newProjectName.trim()) {
      onSaveNewProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  const handleStartRename = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleConfirmRename = () => {
    if (editingProjectId && editingProjectName.trim()) {
      onRenameProject(editingProjectId, editingProjectName.trim());
      setEditingProjectId(null);
      setEditingProjectName('');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Project Manager</h2>
          <button onClick={onClose} aria-label="Close project manager">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold mb-2">Save Current Analysis</h3>
            <p className="text-sm text-slate-500 mb-2">
              Save your current progress as a new project.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={currentFormData.location ? `Project for ${currentFormData.location}` : 'Enter project name'}
                className="flex-grow px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
              />
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-slate-400" disabled={!newProjectName.trim()}>
                Save
              </button>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">My Saved Projects</h3>
              <button onClick={() => { onNewProject(); onClose(); }} className="px-3 py-1 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                New Project
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="text-center text-slate-500 py-8">You have no saved projects.</p>
            ) : (
              <ul className="space-y-2">
                {projects.map(p => (
                  <li key={p.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${activeProjectId === p.id ? 'bg-green-100 dark:bg-green-900/50' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                    {editingProjectId === p.id ? (
                      <input 
                        type="text"
                        value={editingProjectName}
                        onChange={e => setEditingProjectName(e.target.value)}
                        onBlur={handleConfirmRename}
                        onKeyDown={e => e.key === 'Enter' && handleConfirmRename()}
                        autoFocus
                        className="flex-grow px-2 py-1 bg-white dark:bg-slate-600 border border-green-500 rounded-md"
                      />
                    ) : (
                      <div className="flex-grow">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                        <p className="text-xs text-slate-500">Last updated: {new Date(p.updatedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {editingProjectId === p.id ? (
                        <button onClick={handleConfirmRename} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md">✓</button>
                      ) : (
                        <>
                          <button onClick={() => onLoadProject(p.id)} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 font-semibold rounded-md hover:bg-blue-200 dark:hover:bg-blue-800">Load</button>
                          <button onClick={() => handleStartRename(p)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md" aria-label="Rename project">✏️</button>
                          <button onClick={() => onDeleteProject(p.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" aria-label="Delete project">🗑️</button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManager;
