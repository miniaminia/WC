import { useState } from 'react';
import type { Project } from '../types';
import { Modal } from './Modal';
import { generateProjectColor, isDuplicateColor } from '../utils/colorUtils';

interface Props {
  existing?: Project;
  existingColors: string[];
  onSave: (data: Omit<Project, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const PALETTE = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7',
];

export function ProjectModal({ existing, existingColors, onSave, onClose }: Props) {
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(
    existing?.color ?? generateProjectColor(existingColors)
  );
  const [error, setError] = useState('');

  const usedColors = existingColors.filter(c =>
    existing ? c !== existing.color : true
  );

  const handleSubmit = () => {
    if (!name.trim()) { setError('프로젝트 이름을 입력해주세요.'); return; }
    if (isDuplicateColor(color, usedColors)) {
      setError('이미 사용 중인 색상입니다. 다른 색상을 선택해주세요.');
      return;
    }
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <Modal title={existing ? '프로젝트 수정' : '새 프로젝트'} onClose={onClose}>
      <div className="form-field">
        <label className="form-label">프로젝트 이름 *</label>
        <input
          className="form-input"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="예: 신규 웹사이트 구축"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label className="form-label">대표 색상 *</label>
        <div className="color-palette">
          {PALETTE.map(c => (
            <button
              key={c}
              className={`color-swatch ${color === c ? 'selected' : ''} ${isDuplicateColor(c, usedColors) ? 'used' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setError(''); }}
              title={isDuplicateColor(c, usedColors) ? '이미 사용 중' : c}
            />
          ))}
        </div>
        <div className="color-custom-row">
          <span className="form-label-small">직접 입력:</span>
          <input
            type="color"
            value={color}
            onChange={e => { setColor(e.target.value); setError(''); }}
            className="color-input-native"
          />
          <span className="color-hex">{color}</span>
        </div>
        {isDuplicateColor(color, usedColors) && (
          <p className="form-hint warning">이미 다른 프로젝트에서 사용 중인 색상입니다.</p>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {existing ? '저장' : '만들기'}
        </button>
      </div>
    </Modal>
  );
}
