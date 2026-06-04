import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, EventChangeArg, DatesSetArg } from '@fullcalendar/core';
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
  onMonthChange: (year: number, month: number) => void;
  onReorder: (taskId: string, direction: 'up' | 'down') => void;
}

export function CalendarView({ tasks, projects, members, filters, onDateSelect, onTaskClick, onTaskDrop, onMonthChange, onReorder }: Props) {
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
        sortOrder: task.sortOrder,
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

  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  const renderEventContent = (info: { event: { title: string; extendedProps: Record<string, string>; backgroundColor: string; textColor: string } }) => {
    const { title, extendedProps, textColor } = info.event;
    const taskId = extendedProps.taskId;
    const idx = sortedTasks.findIndex(t => t.id === taskId);
    const canUp = idx > 0;
    const canDown = idx < sortedTasks.length - 1;

    return (
      <div className="fc-event-inner" style={{ color: textColor }}>
        <div className="fc-event-reorder">
          <button
            className="fc-reorder-btn"
            style={{ opacity: canUp ? 1 : 0.3, color: textColor }}
            onClick={e => { e.stopPropagation(); if (canUp) onReorder(taskId, 'up'); }}
          >▲</button>
          <button
            className="fc-reorder-btn"
            style={{ opacity: canDown ? 1 : 0.3, color: textColor }}
            onClick={e => { e.stopPropagation(); if (canDown) onReorder(taskId, 'down'); }}
          >▼</button>
        </div>
        <span className="fc-event-role">[{extendedProps.role}]</span>
        <span className="fc-event-title">{title}</span>
        {extendedProps.assigneeName && (
          <span className="fc-event-assignee"> · {extendedProps.assigneeName}</span>
        )}
      </div>
    );
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
        datesSet={(arg: DatesSetArg) => {
          const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
          onMonthChange(mid.getFullYear(), mid.getMonth() + 1);
        }}
        eventOrder={(a: any, b: any) => (a.extendedProps?.sortOrder ?? 0) - (b.extendedProps?.sortOrder ?? 0)}
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
