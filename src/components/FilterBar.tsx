import type { FilterState, Project, Task, Role } from '../types';
import { ROLES } from '../types';

interface Props {
  filters: FilterState;
  projects: Project[];
  tasks: Task[];
  viewMonth: { year: number; month: number };
  onChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, projects, tasks, viewMonth, onChange }: Props) {
  const { year, month } = viewMonth;
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;
  const activeProjectIds = new Set(
    tasks.filter(t => t.start <= monthEnd && t.end >= monthStart).map(t => t.projectId)
  );
  const visibleProjects = projects.filter(p => activeProjectIds.has(p.id));
  const toggleRole = (role: Role) => {
    const roles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role];
    onChange({ ...filters, roles });
  };

  const toggleProject = (id: string) => {
    const projectIds = filters.projectIds.includes(id)
      ? filters.projectIds.filter(p => p !== id)
      : [...filters.projectIds, id];
    onChange({ ...filters, projectIds });
  };

  const clearAll = () => onChange({ roles: [...ROLES], projectIds: [] });
  const hasFilter = filters.roles.length < ROLES.length || filters.projectIds.length > 0;

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">역할</span>
        {ROLES.map(role => (
          <button
            key={role}
            className={`filter-chip ${filters.roles.includes(role) ? 'active' : ''}`}
            onClick={() => toggleRole(role)}
          >
            {role}
          </button>
        ))}
      </div>

      {visibleProjects.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">프로젝트</span>
          {visibleProjects.map(p => (
            <button
              key={p.id}
              className={`filter-chip ${filters.projectIds.includes(p.id) ? 'active' : ''}`}
              onClick={() => toggleProject(p.id)}
              style={filters.projectIds.includes(p.id) ? {
                backgroundColor: p.color,
                borderColor: p.color,
                color: '#fff',
              } : {
                borderColor: p.color,
                color: p.color,
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {hasFilter && (
        <button className="filter-clear" onClick={clearAll}>필터 초기화</button>
      )}
    </div>
  );
}
