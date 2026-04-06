import { useState } from 'react';
import type { Task, Project } from './types';
import { useAppState } from './hooks/useAppState';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { CalendarView } from './components/CalendarView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ProjectModal } from './components/ProjectModal';
import { MemberModal } from './components/MemberModal';
import { ConfirmModal } from './components/ConfirmModal';
import './index.css';

type ModalState =
  | { type: 'none' }
  | { type: 'addProject' }
  | { type: 'editProject'; project: Project }
  | { type: 'deleteProject'; project: Project }
  | { type: 'addTask'; date?: string }
  | { type: 'editTask'; task: Task }
  | { type: 'viewTask'; task: Task }
  | { type: 'deleteTask'; task: Task }
  | { type: 'members' };

export default function App() {
  const state = useAppState();
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const closeModal = () => setModal({ type: 'none' });

  if (state.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#8891a4' }}>
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        projects={state.projects}
        onAddProject={() => setModal({ type: 'addProject' })}
        onEditProject={project => setModal({ type: 'editProject', project })}
        onDeleteProject={project => setModal({ type: 'deleteProject', project })}
        onOpenMembers={() => setModal({ type: 'members' })}
      />

      <main className="main">
        <FilterBar
          filters={state.filters}
          projects={state.projects}
          onChange={state.setFilters}
        />
        <CalendarView
          tasks={state.tasks}
          projects={state.projects}
          members={state.members}
          filters={state.filters}
          onDateSelect={date => setModal({ type: 'addTask', date })}
          onTaskClick={task => setModal({ type: 'viewTask', task })}
          onTaskDrop={(taskId, start, end) => state.updateTask(taskId, { start, end })}
        />
      </main>

      <button
        className="fab"
        onClick={() => setModal({ type: 'addTask' })}
        title="새 일정 추가"
      >＋</button>

      {modal.type === 'addProject' && (
        <ProjectModal
          existingColors={state.projects.map(p => p.color)}
          onSave={data => state.addProject(data)}
          onClose={closeModal}
        />
      )}

      {modal.type === 'editProject' && (
        <ProjectModal
          existing={modal.project}
          existingColors={state.projects.map(p => p.color)}
          onSave={data => state.updateProject(modal.project.id, data)}
          onClose={closeModal}
        />
      )}

      {modal.type === 'deleteProject' && (
        <ConfirmModal
          title="프로젝트 삭제"
          message={`"${modal.project.name}" 프로젝트와 관련된 모든 일정이 삭제됩니다. 계속할까요?`}
          onConfirm={() => state.deleteProject(modal.project.id)}
          onClose={closeModal}
        />
      )}

      {modal.type === 'addTask' && (
        <TaskModal
          projects={state.projects}
          members={state.members}
          defaultDate={modal.date}
          onSave={data => state.addTask(data)}
          onClose={closeModal}
        />
      )}

      {modal.type === 'editTask' && (
        <TaskModal
          existing={modal.task}
          projects={state.projects}
          members={state.members}
          onSave={data => state.updateTask(modal.task.id, data)}
          onClose={closeModal}
        />
      )}

      {modal.type === 'viewTask' && (() => {
        const task = modal.task;
        const project = state.projects.find(p => p.id === task.projectId);
        const assignee = state.members.find(m => m.id === task.assigneeId);
        return (
          <TaskDetailModal
            task={task}
            project={project}
            assignee={assignee}
            onEdit={() => setModal({ type: 'editTask', task })}
            onDelete={() => setModal({ type: 'deleteTask', task })}
            onClose={closeModal}
          />
        );
      })()}

      {modal.type === 'deleteTask' && (
        <ConfirmModal
          title="일정 삭제"
          message={`"${modal.task.title}" (${modal.task.start} ~ ${modal.task.end}) 일정을 삭제할까요?`}
          onConfirm={() => state.deleteTask(modal.task.id)}
          onClose={closeModal}
        />
      )}

      {modal.type === 'members' && (
        <MemberModal
          members={state.members}
          onAdd={state.addMember}
          onDelete={state.deleteMember}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
