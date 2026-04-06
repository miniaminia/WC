import { useState, useCallback } from 'react';
import type { Project, Task, Member, FilterState } from '../types';
import { ROLES } from '../types';
import { storage } from '../utils/storage';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useAppState() {
  const [projects, setProjects] = useState<Project[]>(() => storage.loadProjects());
  const [tasks, setTasks] = useState<Task[]>(() => storage.loadTasks());
  const [members, setMembers] = useState<Member[]>(() => storage.loadMembers());
  const [filters, setFilters] = useState<FilterState>({ roles: [...ROLES], projectIds: [] });

  // Projects
  const addProject = useCallback((data: Omit<Project, 'id' | 'createdAt'>) => {
    const project: Project = { ...data, id: uid(), createdAt: new Date().toISOString() };
    setProjects(prev => {
      const next = [...prev, project];
      storage.saveProjects(next);
      return next;
    });
    return project;
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...data } : p);
      storage.saveProjects(next);
      return next;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      storage.saveProjects(next);
      return next;
    });
    setTasks(prev => {
      const next = prev.filter(t => t.projectId !== id);
      storage.saveTasks(next);
      return next;
    });
  }, []);

  // Tasks
  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const task: Task = { ...data, id: uid(), createdAt: now, updatedAt: now };
    setTasks(prev => {
      const next = [...prev, task];
      storage.saveTasks(next);
      return next;
    });
    return task;
  }, []);

  const updateTask = useCallback((id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => {
      const next = prev.map(t =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      );
      storage.saveTasks(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      storage.saveTasks(next);
      return next;
    });
  }, []);

  // Members
  const addMember = useCallback((data: Omit<Member, 'id'>) => {
    const member: Member = { ...data, id: uid() };
    setMembers(prev => {
      const next = [...prev, member];
      storage.saveMembers(next);
      return next;
    });
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => {
      const next = prev.filter(m => m.id !== id);
      storage.saveMembers(next);
      return next;
    });
  }, []);

  return {
    projects, tasks, members, filters, setFilters,
    addProject, updateProject, deleteProject,
    addTask, updateTask, deleteTask,
    addMember, deleteMember,
  };
}
