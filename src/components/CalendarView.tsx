import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, EventChangeArg } from '@fullcalendar/core';
import type { Task, Project, Member, FilterState } from '../types';
import { getRoleColor, getTextColor } from '../utils/colorUtils';
import { toFCEnd, toInclusiveEnd } from '../utils/dateUtils';

interface Props {
  tasks: Task[];
  projects: Project[];
  members: Member[];
  filters: FilterState;
  onDateSelect: (date: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, start: string, end: string) => void;
}

export function CalendarView({ tasks, projects, members, filters, onDateSelect, onTaskClick, onTaskDrop }: Props) {
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

  const filteredTasks = tasks.filter(t => {
    const roleOk = filters.roles.includes(t.role);
    const projectOk = filters.projectIds.length === 0 || filters.projectIds.includes(t.projectId);
    return roleOk && projectOk;
  });

  const events = filteredTasks.map(task => {
    const project = projectMap[task.projectId];
    const bgColor = project ? getRoleColor(project.color, task.role) : '#999';
    const textColor = getTextColor(bgColor);
    const assignee = memberMap[task.assigneeId];

    return {
      id: task.id,
      title: task.title,
      start: task.start,
      end: toFCEnd(task.end),
      allDay: true,
      backgroundColor: bgColor,
      borderColor: bgColor,
      textColor,
      extendedProps: {
        taskId: task.id,
        role: task.role,
        assigneeName: assignee?.name ?? '',
        projectName: project?.name ?? '',
      },
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    const task = tasks.find(t => t.id === info.event.extendedProps.taskId);
    if (task) onTaskClick(task);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    onDateSelect(info.startStr);
  };

  const handleEventDrop = (info: EventDropArg) => {
    const { event } = info;
    const taskId = event.extendedProps.taskId as string;
    const start = event.startStr;
    const end = event.endStr ? toInclusiveEnd(event.endStr) : start;
    onTaskDrop(taskId, start, end);
  };

  const handleEventChange = (info: EventChangeArg) => {
    const { event } = info;
    const taskId = event.extendedProps.taskId as string;
    const start = event.startStr;
    const end = event.endStr ? toInclusiveEnd(event.endStr) : start;
    onTaskDrop(taskId, start, end);
  };

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        buttonText={{ today: '오늘', month: '월', week: '주' }}
        events={events}
        eventClick={handleEventClick}
        selectable
        select={handleDateSelect}
        editable
        eventDrop={handleEventDrop}
        eventResize={handleEventChange}
        eventContent={renderEventContent}
        dayMaxEvents={3}
        height="100%"
        fixedWeekCount={false}
        showNonCurrentDates={false}
      />
    </div>
  );
}

function renderEventContent(info: { event: { title: string; extendedProps: Record<string, string>; backgroundColor: string; textColor: string } }) {
  const { title, extendedProps, textColor } = info.event;
  return (
    <div className="fc-event-inner" style={{ color: textColor }}>
      <span className="fc-event-role">[{extendedProps.role}]</span>
      <span className="fc-event-title">{title}</span>
      {extendedProps.assigneeName && (
        <span className="fc-event-assignee"> · {extendedProps.assigneeName}</span>
      )}
    </div>
  );
}
