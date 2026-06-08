import { useState, useEffect } from 'react';
import type { Task, Project, Member, Role } from '../types';
import { ROLES } from '../types';
import { Modal } from './Modal';
import { today } from '../utils/dateUtils';
import { isNonWorkday, adjustStartToWorkday, adjustEndToWorkday } from '../utils/holidays';
import { generateProjectColor } from '../utils/colorUtils';

const PALETTE = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7',
];

interface Props {
  existing?: Task;
  projects: Project[];
  members: Member[];
  defaultDate?: string;
  defaultProjectId?: string;
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => void;
  onAddProject: (data: { name: string; color: string }) => Promise<Project>;
  onClose: () => void;
}

export function TaskModal({ existing, projects, members, defaultDate, defaultProjectId, onSave, onAddProject, onClose }: Props) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [projectId, setProjectId] = useState(existing?.projectId ?? defaultProjectId ?? projects[0]?.id ?? '');
  const [role, setRole] = useState<Role>(existing?.role ?? '기획');
  const [assigneeId, setAssigneeId] = useState(existing?.assigneeId ?? '');
  const [start, setStart] = useState(() => {
    const d = existing?.start ?? defaultDate ?? today();
    return (existing?.role === '기타' || isNonWorkday(d) === false) ? d : adjustStartToWorkday(d);
  });
  const [end, setEnd] = useState(() => {
    const d = existing?.end ?? defaultDate ?? today();
    return (existing?.role === '기타' || isNonWorkday(d) === false) ? d : adjustEndToWorkday(d);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthColors = projects.filter(p => p.createdAt.startsWith(thisMonth)).map(p => p.color);
  const [newColor, setNewColor] = useState(() => generateProjectColor(thisMonthColors));
  const [newError, setNewError] = useState('');

  const filteredMembers = members.filter(m => m.roles.includes(role));

  useEffect(() => {
    if (!filteredMembers.find(m => m.id === assigneeId)) {
      setAssigneeId(filteredMembers[0]?.id ?? '');
    }
  }, [role]);

  useEffect(() => {
    if (!existing && role === '오픈일') {
      const projectName = projects.find(p => p.id === projectId)?.name ?? '';
      setTitle(projectName);
    }
  }, [role, projectId]);

  const handleProjectChange = (val: string) => {
    if (val === '__new__') {
      setShowNewProject(true);
      setNewName('');
      setNewColor(generateProjectColor(thisMonthColors));
    } else {
      setProjectId(val);
      setErrors(prev => ({ ...prev, projectId: '' }));
    }
  };

  const handleCreateProject = async () => {
    if (!newName.trim()) { setNewError('이름을 입력해주세요.'); return; }
    const project = await onAddProject({ name: newName.trim(), color: newColor });
    setProjectId(project.id);
    setShowNewProject(false);
    setErrors(prev => ({ ...prev, projectId: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = '업무 제목을 입력해주세요.';
    if (!projectId) e.projectId = '프로젝트를 선택해주세요.';
    if (!assigneeId) e.assigneeId = '담당자를 선택해주세요.';
    if (start > end) e.end = '종료일은 시작일 이후여야 합니다.';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ title: title.trim(), projectId, role, assigneeId, start, end });
    onClose();
  };

  return (
    <Modal title={existing ? '일정 수정' : '새 일정 추가'} onClose={onClose} width={520}>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">프로젝트 *</label>
          <select
            className={`form-select ${errors.projectId ? 'error' : ''}`}
            value={showNewProject ? '__new__' : projectId}
            onChange={e => handleProjectChange(e.target.value)}
          >
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="__new__">+ 새 프로젝트 추가</option>
          </select>
          {errors.projectId && <p className="form-error">{errors.projectId}</p>}
        </div>

        <div className="form-field">
          <label className="form-label">역할 *</label>
          <select
            className="form-select"
            value={role}
            onChange={e => setRole(e.target.value as Role)}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {showNewProject && (
        <div className="inline-new-project">
          <input
            className="form-input"
            value={newName}
            onChange={e => { setNewName(e.target.value); setNewError(''); }}
            placeholder="프로젝트 이름"
            autoFocus
          />
          <div className="color-palette" style={{ marginTop: 8 }}>
            {PALETTE.map(c => (
              <button
                key={c}
                className={`color-swatch ${newColor === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          {newError && <p className="form-error">{newError}</p>}
          <div className="inline-new-project-actions">
            <button className="btn btn-secondary" onClick={() => setShowNewProject(false)}>취소</button>
            <button className="btn btn-primary" onClick={handleCreateProject}>만들기</button>
          </div>
        </div>
      )}

      <div className="form-field">
        <label className="form-label">업무 제목 *</label>
        <input
          className={`form-input ${errors.title ? 'error' : ''}`}
          value={title}
          onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: '' })); }}
          placeholder="예: UI 와이어프레임 작성"
          autoFocus={!showNewProject}
        />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="form-field">
        <label className="form-label">담당자 *</label>
        <select
          className={`form-select ${errors.assigneeId ? 'error' : ''}`}
          value={assigneeId}
          onChange={e => { setAssigneeId(e.target.value); setErrors(prev => ({ ...prev, assigneeId: '' })); }}
        >
          {filteredMembers.length === 0 && <option value="">해당 역할 담당자 없음</option>}
          {filteredMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {errors.assigneeId && <p className="form-error">{errors.assigneeId}</p>}
        {filteredMembers.length === 0 && (
          <p className="form-hint">팀원 관리에서 해당 역할의 팀원을 추가해주세요.</p>
        )}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">시작일 *</label>
          <input
            type="date"
            className="form-input"
            value={start}
            onChange={e => {
              const val = e.target.value;
              setStart(role !== '기타' && isNonWorkday(val) ? adjustStartToWorkday(val) : val);
              setErrors(prev => ({ ...prev, end: '' }));
            }}
          />
        </div>
        <div className="form-field">
          <label className="form-label">종료일 *</label>
          <input
            type="date"
            className="form-input"
            value={end}
            min={start}
            onChange={e => {
              const val = e.target.value;
              setEnd(role !== '기타' && isNonWorkday(val) ? adjustEndToWorkday(val) : val);
              setErrors(prev => ({ ...prev, end: '' }));
            }}
          />
          {errors.end && <p className="form-error">{errors.end}</p>}
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={projects.length === 0 && !showNewProject}
        >
          {existing ? '저장' : '추가'}
        </button>
      </div>
    </Modal>
  );
}
