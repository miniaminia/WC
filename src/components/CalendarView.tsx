import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, EventChangeArg } from '@fullcalendar/core';
import type { Task, Project, Member, FilterState } from '../types';
import { getRoleColor, getTextColor } from '../utils/colorUtils';
import { toFCEnd, toInclusiveEnd } from '../utils/dateUtils';
import { isHoliday, isWeekend, getWorkdaySegments } from '../utils/holidays';

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

  const events = filteredTasks.flatMap(task => {
    const project = projectMap[task.projectId];
    const bgColor = project ? getRoleColor(project.color, task.role) : '#999';
    const textColor = getTextColor(bgColor);
    const assignee = memberMap[task.assigneeId];

    const base = {
      title: task.title,
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

    const segments = getWorkdaySegments(task.start, task.end);

    if (segments.length <= 1) {
      return [{ ...base, id: task.id, start: task.start, end: toFCEnd(task.end) }];
    }

    // 주말/공휴일 걸치는 경우: 업무일 구간별로 분리, 드래그 비활성화
    return segments.map((seg, i) => ({
      ...base,
      id: `${task.id}_${i}`,
      start: seg.start,
      end: toFCEnd(seg.end),
      editable: false,
    }));
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
        buttonText={{ today: '오늘', month: '월', week: '주', prev: '‹', next: '›' }}
        events={events}
        eventClick={handleEventClick}
        selectable
        select={handleDateSelect}
        editable
        eventDrop={handleEventDrop}
        eventResize={handleEventChange}
        eventContent={renderEventContent}
        dayMaxEvents={8}
        height="100%"
        fixedWeekCount={false}
        showNonCurrentDates={false}
        dayCellClassNames={(arg) => {
          const y = arg.date.getFullYear();
          const m = String(arg.date.getMonth() + 1).padStart(2, '0');
          const d = String(arg.date.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          if (isHoliday(dateStr)) return ['fc-day-holiday'];
          if (isWeekend(dateStr)) return ['fc-day-weekend'];
          return [];
        }}
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
