import { Modal } from './Modal';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onClose }: Props) {
  return (
    <Modal title={title} onClose={onClose} width={380}>
      <p style={{ marginBottom: 24, color: '#555', lineHeight: 1.6 }}>{message}</p>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>삭제</button>
      </div>
    </Modal>
  );
}
