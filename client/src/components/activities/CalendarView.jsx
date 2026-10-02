import React, { useState, useEffect, useMemo } from 'react';
import { activitiesApi } from '../../api/activitiesApi.js';
import { ActivityFormModal } from '../forms/ActivityFormModal.jsx';
import { Button } from '../common/Button.jsx';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckSquare,
  Phone,
  Clock,
  User,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView = ({ onActivityUpdated }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    editData: null,
    defaultDate: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate calendar month start and end dates
  const { daysInMonth, startDayIndex, startDateIso, endDateIso } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIndex = firstDay.getDay();

    // Range for API query (include buffer days from prev/next month)
    const qStart = new Date(year, month, 1 - startDayIndex);
    const qEnd = new Date(year, month, daysInMonth + (6 - lastDay.getDay()));

    return {
      daysInMonth,
      startDayIndex,
      startDateIso: qStart.toISOString(),
      endDateIso: qEnd.toISOString(),
    };
  }, [year, month]);

  const fetchMonthActivities = async () => {
    try {
      setIsLoading(true);
      const res = await activitiesApi.getCalendar({
        start: startDateIso,
        end: endDateIso,
        type: typeFilter || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar activities:', err);
      toast.error('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthActivities();
  }, [startDateIso, endDateIso, typeFilter]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group activities by date YYYY-MM-DD
  const activitiesByDate = useMemo(() => {
    const map = {};
    if (!Array.isArray(activities)) return map;
    activities.forEach((act) => {
      if (!act || !act.dueDate) return;
      try {
        const d = new Date(act.dueDate);
        if (isNaN(d.getTime())) return;
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(act);
      } catch (err) {
        // ignore invalid date strings
      }
    });
    return map;
  }, [activities]);

  // Build grid days
  const calendarCells = useMemo(() => {
    const cells = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month filler days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const cellDate = new Date(year, month - 1, d);
      const dateStr = cellDate.toISOString().split('T')[0];
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: activitiesByDate[dateStr] || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dateStr = cellDate.toISOString().split('T')[0];
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: activitiesByDate[dateStr] || [],
      });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const cellDate = new Date(year, month + 1, d);
      const dateStr = cellDate.toISOString().split('T')[0];
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: activitiesByDate[dateStr] || [],
      });
    }

    return cells;
  }, [year, month, daysInMonth, startDayIndex, activitiesByDate]);

  const openAddForDay = (dateStr) => {
    // Set 09:00 AM on clicked date
    const d = new Date(dateStr);
    d.setHours(9, 0, 0, 0);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const formatted = d.toISOString().slice(0, 16);

    setModalState({
      isOpen: true,
      editData: null,
      defaultDate: formatted,
    });
  };

  const openEditEvent = (act, e) => {
    e.stopPropagation();
    setModalState({
      isOpen: true,
      editData: act,
      defaultDate: '',
    });
  };

  const formatEventTime = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Call':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'Meeting':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'Note':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls & Month Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly schedule of calls, team meetings, tasks & follow-ups
            </p>
          </div>
        </div>

        {/* Filter + Navigation */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Activity Types</option>
            <option value="Task">Tasks Only</option>
            <option value="Call">Calls Only</option>
            <option value="Meeting">Meetings Only</option>
          </select>

          <Button size="xs" variant="outline" onClick={handleToday}>
            Today
          </Button>

          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors border-l border-slate-200 dark:border-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="xs"
            variant="primary"
            icon={Plus}
            onClick={() => setModalState({ isOpen: true, editData: null, defaultDate: '' })}
          >
            Schedule
          </Button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50">
          {DAYS_OF_WEEK.map((day, idx) => (
            <div
              key={day}
              className={`py-3 text-center text-xs font-semibold ${
                idx === 0 || idx === 6
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              onClick={() => openAddForDay(cell.dateStr)}
              className={`min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-colors relative group ${
                cell.isCurrentMonth
                  ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                  : 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600 hover:bg-slate-100/40 dark:hover:bg-slate-800/40'
              } ${cell.isToday ? 'ring-2 ring-inset ring-indigo-500/80 bg-indigo-50/20' : ''}`}
            >
              {/* Day Cell Header: Number + Quick Add */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    cell.isToday
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddForDay(cell.dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-opacity"
                  title="Add activity on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Events Stack */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] no-scrollbar">
                {cell.events.slice(0, 3).map((act) => {
                  const style = getTypeStyle(act.type);
                  return (
                    <div
                      key={act._id}
                      onClick={(e) => openEditEvent(act, e)}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold truncate transition-all flex items-center gap-1 hover:brightness-95 ${style}`}
                      title={`${act.type}: ${act.title || ''} (${formatEventTime(act.dueDate)})`}
                    >
                      {act.type === 'Call' ? (
                        <Phone className="w-2.5 h-2.5 shrink-0" />
                      ) : act.type === 'Meeting' ? (
                        <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
                      ) : (
                        <CheckSquare className="w-2.5 h-2.5 shrink-0" />
                      )}
                      <span className={`truncate ${act.status === 'Completed' ? 'line-through opacity-70' : ''}`}>
                        {act.title}
                      </span>
                    </div>
                  );
                })}

                {cell.events.length > 3 && (
                  <div className="text-[10px] text-center font-bold text-slate-400 hover:text-indigo-600">
                    +{cell.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <ActivityFormModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, editData: null, defaultDate: '' })}
        onSuccess={() => {
          fetchMonthActivities();
          if (onActivityUpdated) onActivityUpdated();
        }}
        initialData={modalState.editData}
        defaultType="Meeting"
      />
    </div>
  );
};
