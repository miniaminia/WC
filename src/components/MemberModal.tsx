import { useState } from 'react';
import type { Member, Role } from '../types';
import { ROLES } from '../types';
import { Modal } from './Modal';

interface Props {
  members: Member[];
  onAdd: (data: Omit<Member, 'id'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function MemberModal({ members, onAdd, onDelete, onClose }: Props) {
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['기획']);
  const [error, setError] = useState('');

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleAdd = () => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (selectedRoles.length === 0) { setError('역할을 하나 이상 선택해주세요.'); return; }
    onAdd({ name: name.trim(), roles: selectedRoles });
    setName('');
    setSelectedRoles(['기획']);
    setError('');
  };

  return (
    <Modal title="팀원 관리" onClose={onClose} width={460}>
      <div className="member-list">
        {members.map(m => (
          <div key={m.id} className="member-row">
            <div className="member-info">
              <span className="member-name">{m.name}</span>
              <span className="member-roles">{m.roles.join(', ')}</span>
            </div>
            <button
              className="btn-icon danger"
              onClick={() => onDelete(m.id)}
              title="삭제"
            >✕</button>
          </div>
        ))}
        {members.length === 0 && (
          <p className="empty-hint">등록된 팀원이 없습니다.</p>
        )}
      </div>

      <div className="member-add-form">
        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>팀원 추가</h4>
        <div className="form-field">
          <input
            className="form-input"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="이름"
          />
        </div>
        <div className="form-field">
          <div className="role-toggle-group">
            {ROLES.map(r => (
              <button
                key={r}
                className={`role-toggle ${selectedRoles.includes(r) ? 'active' : ''}`}
                onClick={() => toggleRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
          추가
        </button>
      </div>
    </Modal>
  );
}
