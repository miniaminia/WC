import type { Member, Project, Task } from '../types';

const KEYS = {
  projects: 'pcal_projects',
  tasks: 'pcal_tasks',
  members: 'pcal_members',
  filters: 'pcal_filters',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadProjects: (): Project[] => load<Project[]>(KEYS.projects, []),
  saveProjects: (data: Project[]) => save(KEYS.projects, data),

  loadTasks: (): Task[] => load<Task[]>(KEYS.tasks, []),
  saveTasks: (data: Task[]) => save(KEYS.tasks, data),

  loadMembers: (): Member[] => load<Member[]>(KEYS.members, defaultMembers),
  saveMembers: (data: Member[]) => save(KEYS.members, data),
};

const defaultMembers: Member[] = [
  { id: 'm1', name: '김기획', roles: ['기획'] },
  { id: 'm2', name: '이디자인', roles: ['디자인'] },
  { id: 'm3', name: '박퍼블', roles: ['퍼블리싱'] },
  { id: 'm4', name: '최매니저', roles: ['기획', '디자인', '퍼블리싱'] },
];
