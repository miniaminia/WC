import type { Task, Project, Member } from '../types';
import { Modal } from './Modal';
import { formatDate } from '../utils/dateUtils';
import { getRoleColor, getTextColor } from '../utils/colorUtils';

interface Props {
  task: Task;
  project: Project | undefined;
  assignee: Member | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TaskDetailModal({ task, project, assignee, onEdit, onDelete, onClose }: Props) {
  const bgColor = project ? getRoleColor(project.color, task.role) : '#ccc';
  const textColor = getTextColor(bgColor);

  return (
    <Modal title="일정 상세" onClose={onClose} width={440}>
      <div className="task-detail-header" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="task-detail-role-badge">{task.role}</div>
        <h3 className="task-detail-title">{task.title}</h3>
        {project && <div className="task-detail-project">📁 {project.name}</div>}
      </div>

      <div className="task-detail-body">
        <div className="task-detail-row">
          <span className="task-detail-label">담당자</span>
          <span className="task-detail-value">{assignee?.name ?? '알 수 없음'}</span>
        </div>
        <div className="task-detail-row">
          <span className="task-detail-label">역할</span>
          <span className="task-detail-value">{task.role}</span>
        </div>
        <div className="task-detail-row">
          <span className="task-detail-label">시작일</span>
          <span className="task-detail-value">{formatDate(task.start)}</span>
        </div>
        <div className="task-detail-row">
          <span className="task-detail-label">종료일</span>
          <span className="task-detail-value">{formatDate(task.end)}</span>
        </div>
        <div className="task-detail-row">
          <span className="task-detail-label">기간</span>
          <span className="task-detail-value">
            {Math.ceil((new Date(task.end).getTime() - new Date(task.start).getTime()) / 86400000) + 1}일
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-danger-outline" onClick={onDelete}>삭제</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>닫기</button>
          <button className="btn btn-primary" onClick={onEdit}>수정</button>
        </div>
      </div>
    </Modal>
  );
}
