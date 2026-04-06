import type { Project } from '../types';
import { getRoleColor } from '../utils/colorUtils';
import { ROLES } from '../types';

interface Props {
  projects: Project[];
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onOpenMembers: () => void;
}

export function Sidebar({ projects, onAddProject, onEditProject, onDeleteProject, onOpenMembers }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">📅 일정 캘린더</h1>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">프로젝트</span>
          <button className="btn-icon" onClick={onAddProject} title="프로젝트 추가">＋</button>
        </div>

        {projects.length === 0 && (
          <p className="sidebar-empty">프로젝트가 없습니다.<br />새 프로젝트를 추가해보세요.</p>
        )}

        <div className="project-list">
          {projects.map(p => (
            <div key={p.id} className="project-item">
              <div className="project-item-main">
                <span className="project-dot" style={{ backgroundColor: p.color }} />
                <span className="project-name">{p.name}</span>
              </div>
              <div className="project-item-actions">
                <button className="btn-icon small" onClick={() => onEditProject(p)} title="수정">✎</button>
                <button className="btn-icon small danger" onClick={() => onDeleteProject(p)} title="삭제">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title" style={{ marginBottom: 10 }}>색상 범례</div>
        <div className="legend-list">
          {ROLES.map(role => (
            <div key={role} className="legend-item">
              <div className="legend-swatches">
                {projects.slice(0, 3).map(p => (
                  <span
                    key={p.id}
                    className="legend-swatch"
                    style={{ backgroundColor: getRoleColor(p.color, role) }}
                    title={p.name}
                  />
                ))}
                {projects.length === 0 && (
                  <span className="legend-swatch" style={{ backgroundColor: '#e0e0e0' }} />
                )}
              </div>
              <span className="legend-label">{role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-bottom">
        <button className="btn btn-ghost" onClick={onOpenMembers}>
          👥 팀원 관리
        </button>
      </div>
    </aside>
  );
}
