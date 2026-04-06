import { useState, useCallback, useEffect } from 'react';
import type { Project, Task, Member, FilterState } from '../types';
import { ROLES } from '../types';
import { supabase } from '../lib/supabase';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const defaultMembers: Member[] = [
  { id: 'm1', name: '김기획', roles: ['기획'] },
  { id: 'm2', name: '이디자인', roles: ['디자인'] },
  { id: 'm3', name: '박퍼블', roles: ['퍼블리싱'] },
  { id: 'm4', name: '최매니저', roles: ['기획', '디자인', '퍼블리싱'] },
];

export function useAppState() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>(defaultMembers);
  const [filters, setFilters] = useState<FilterState>({ roles: [...ROLES], projectIds: [] });
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    async function load() {
      const [{ data: projectsData }, { data: tasksData }, { data: membersData }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at'),
        supabase.from('tasks').select('*').order('created_at'),
        supabase.from('members').select('*'),
      ]);

      if (projectsData) setProjects(projectsData.map(p => ({
        id: p.id, name: p.name, color: p.color, createdAt: p.created_at,
      })));

      if (tasksData) setTasks(tasksData.map(t => ({
        id: t.id, projectId: t.project_id, title: t.title, role: t.role,
        assigneeId: t.assignee_id, start: t.start, end: t.end,
        createdAt: t.created_at, updatedAt: t.updated_at,
      })));

      if (membersData && membersData.length > 0) setMembers(membersData.map(m => ({
        id: m.id, name: m.name, roles: m.roles,
      })));

      setLoading(false);
    }
    load();
  }, []);

  // 실시간 동기화
  useEffect(() => {
    const channel = supabase
      .channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async () => {
        const { data } = await supabase.from('projects').select('*').order('created_at');
        if (data) setProjects(data.map(p => ({
          id: p.id, name: p.name, color: p.color, createdAt: p.created_at,
        })));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
        const { data } = await supabase.from('tasks').select('*').order('created_at');
        if (data) setTasks(data.map(t => ({
          id: t.id, projectId: t.project_id, title: t.title, role: t.role,
          assigneeId: t.assignee_id, start: t.start, end: t.end,
          createdAt: t.created_at, updatedAt: t.updated_at,
        })));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, async () => {
        const { data } = await supabase.from('members').select('*');
        if (data) setMembers(data.map(m => ({
          id: m.id, name: m.name, roles: m.roles,
        })));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Projects
  const addProject = useCallback(async (data: Omit<Project, 'id' | 'createdAt'>) => {
    const id = uid();
    const { data: row } = await supabase.from('projects').insert({ id, name: data.name, color: data.color }).select().single();
    const project: Project = { id, name: data.name, color: data.color, createdAt: row?.created_at ?? new Date().toISOString() };
    setProjects(prev => [...prev, project]);
    return project;
  }, []);

  const updateProject = useCallback(async (id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    await supabase.from('projects').update({ name: data.name, color: data.color }).eq('id', id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  }, []);

  // Tasks
  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = uid();
    const now = new Date().toISOString();
    await supabase.from('tasks').insert({
      id, project_id: data.projectId, title: data.title, role: data.role,
      assignee_id: data.assigneeId, start: data.start, end: data.end,
    });
    const task: Task = { ...data, id, createdAt: now, updatedAt: now };
    setTasks(prev => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    await supabase.from('tasks').update({
      title: data.title, role: data.role, assignee_id: data.assigneeId,
      start: data.start, end: data.end, project_id: data.projectId,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Members
  const addMember = useCallback(async (data: Omit<Member, 'id'>) => {
    const id = uid();
    await supabase.from('members').insert({ id, name: data.name, roles: data.roles });
    setMembers(prev => [...prev, { ...data, id }]);
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    await supabase.from('members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  return {
    projects, tasks, members, filters, setFilters, loading,
    addProject, updateProject, deleteProject,
    addTask, updateTask, deleteTask,
    addMember, deleteMember,
  };
}
