export type Role = '기획' | '디자인' | '퍼블리싱';

export const ROLES: Role[] = ['기획', '디자인', '퍼블리싱'];

export interface Member {
  id: string;
  name: string;
  roles: Role[];
}

export interface Project {
  id: string;
  name: string;
  color: string; // hex
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  role: Role;
  assigneeId: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD (inclusive)
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  roles: Role[];
  projectIds: string[];
}
