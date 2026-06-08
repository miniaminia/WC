import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, EventChangeArg, DatesSetArg } from '@fullcalendar/core';
import type { Task, Project, Member, FilterState } from '../types';
import { getRoleColor, getTextColor } from '../utils/colorUtils';
import { toFCEnd, toInclusiveEnd } from '../utils/dateUtils';
import { isHoliday, isWeekend, getWorkdaySegments, adjustStartToWorkday, countWorkdays, addWorkdays } from '../utils/holidays';

interface Props {
  tasks: Task[];
  projects: Project[];
  members: Member[];
  filters: FilterState;
  onDateSelect: (date: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, start: string, end: string) => void;
  onMonthChange: (year: number, month: number) => void;
  onSwap: (fromId: string, toId: string) => void;
}

export function CalendarView({ tasks, projects, members, filters, onDateSelect, onTaskClick, onTaskDrop, onMonthChange, onSwap }: Props) {
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
    const orderPrefix = String(task.sortOrder).padStart(20, '0');

    const base = {
      title: task.title,
      allDay: true,
      backgroundColor: bgColor,
      borderColor: task.role === '기타' ? '#b0b0b0' : bgColor,
      textColor,
      extendedProps: {
        taskId: task.id,
        role: task.role,
        assigneeName: assignee?.name ?? '',
        projectName: project?.name ?? '',
      },
    };

    // 기타 역할은 주말 포함 연속 표시
    if (task.role === '기타') {
      return [{ ...base, id: `${orderPrefix}_${task.id}`, start: task.start, end: toFCEnd(task.end) }];
    }

    const segments = getWorkdaySegments(task.start, task.end);

    if (segments.length <= 1) {
      return [{ ...base, id: `${orderPrefix}_${task.id}`, start: task.start, end: toFCEnd(task.end) }];
    }

    return segments.map((seg, i) => ({
      ...base,
      id: `${orderPrefix}_${task.id}_${i}`,
      start: seg.start,
      end: toFCEnd(seg.end),
      editable: i === 0,
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
    const taskId = info.event.extendedProps.taskId as string;
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const rawStart = info.event.startStr;
    if (originalTask.role === '기타') {
      const rawEnd = info.event.endStr ? toInclusiveEnd(info.event.endStr) : rawStart;
      onTaskDrop(taskId, rawStart, rawEnd);
      return;
    }
    const newStart = adjustStartToWorkday(rawStart);
    const workdays = countWorkdays(originalTask.start, originalTask.end);
    const newEnd = addWorkdays(newStart, workdays);
    onTaskDrop(taskId, newStart, newEnd);
  };

  const handleEventChange = (info: EventChangeArg) => {
    const taskId = info.event.extendedProps.taskId as string;
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const rawStart = info.event.startStr;
    if (originalTask.role === '기타') {
      const rawEnd = info.event.endStr ? toInclusiveEnd(info.event.endStr) : rawStart;
      onTaskDrop(taskId, rawStart, rawEnd);
      return;
    }
    const newStart = adjustStartToWorkday(rawStart);
    const workdays = countWorkdays(originalTask.start, originalTask.end);
    const newEnd = addWorkdays(newStart, workdays);
    onTaskDrop(taskId, newStart, newEnd);
  };

  const renderEventContent = (info: { event: { title: string; extendedProps: Record<string, string>; textColor: string } }) => {
    const { title, extendedProps, textColor } = info.event;
    const taskId = extendedProps.taskId;
    const clickedTask = tasks.find(t => t.id === taskId);

    let prevTaskId: string | null = null;
    let nextTaskId: string | null = null;

    if (clickedTask) {
      const sameDayTasks = tasks
        .filter(t =>
          t.start <= clickedTask.start && t.end >= clickedTask.start &&
          filters.roles.includes(t.role) &&
          (filters.projectIds.length === 0 || filters.projectIds.includes(t.projectId))
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const idx = sameDayTasks.findIndex(t => t.id === taskId);
      prevTaskId = idx > 0 ? sameDayTasks[idx - 1].id : null;
      nextTaskId = idx < sameDayTasks.length - 1 ? sameDayTasks[idx + 1].id : null;
    }

    return (
      <div className="fc-event-inner" style={{ color: textColor }}>
        <div className="fc-event-reorder">
          <button
            className="fc-reorder-btn"
            style={{ opacity: prevTaskId ? 1 : 0.3, color: textColor }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); if (prevTaskId) onSwap(taskId, prevTaskId); }}
          >▲</button>
          <button
            className="fc-reorder-btn"
            style={{ opacity: nextTaskId ? 1 : 0.3, color: textColor }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); if (nextTaskId) onSwap(taskId, nextTaskId); }}
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
        eventOrder="id"
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
