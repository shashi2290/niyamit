import { useState, useEffect, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  subDays,
  setHours,
  setMinutes,
  parse,
  addWeeks,
  subWeeks,
  isAfter,
  startOfToday
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  X,
  Pencil,
  RotateCcw,
  Copy,
  ClipboardPaste,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useTasks } from "../contexts/TaskContext";

// Helper to get task ID (works with both MongoDB _id and fallback id)
const getTaskId = (task) => task._id || task.id;

// Helper to check if task is editable
const isTaskEditable = (task) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const taskDate = parse(task.date, 'yyyy-MM-dd', new Date());
    taskDate.setHours(0,0,0,0);

    // 1. Previous days strict lock
    if (taskDate < today) return false;

    // 2. Today's tasks: 3 hour window after end time
    if (isSameDay(taskDate, today) && task.endTime) {
        const now = new Date();
        const [h, m] = task.endTime.split(':').map(Number);
        const endTimeDate = new Date(today);
        endTimeDate.setHours(h, m, 0, 0);
        
        // Window is 3 hours
        const lockTime = new Date(endTimeDate.getTime() + 3 * 60 * 60 * 1000);
        if (now > lockTime) return false;
    }
    
    return true;
};

// Helper to get pixels from "HH:MM"
const getTopHeight = (startTime, endTime, PIXELS_PER_HOUR = 60) => {
  if (!startTime || !endTime) return { top: 0, height: 60 };
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  const top = (startMinutes / 60) * PIXELS_PER_HOUR;
  const duration = ((endMinutes - startMinutes) / 60) * PIXELS_PER_HOUR;
  return { top, height: Math.max(duration, 30) }; // Min height 30px
};

const DayTimeGridView = ({
  selectedDate,
  getTasksByDate,
  handleTimeSlotClick,
  handleTimeDrop,
  handleEditClick,
  handleDragStart,
  handleDragEnd,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const PIXELS_PER_HOUR = 60;
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const nowMins = new Date().getHours() * 60;
      scrollRef.current.scrollTop = Math.max(0, nowMins - 100);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentTasks = getTasksByDate(format(selectedDate, "yyyy-MM-dd"));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * PIXELS_PER_HOUR;

  return (
    <div className="time-grid-container scrollbox" ref={scrollRef}>
      <div className="time-column">
        {hours.map((hour) => (
          <div key={hour} className="time-label">
            <span className="time-text">
              {format(setHours(new Date(), hour), "h a")}
            </span>
          </div>
        ))}
      </div>
      <div
        className="grid-column"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleTimeDrop(e, selectedDate)}
      >
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid-hour-row"
            style={{
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onClick={() => handleTimeSlotClick(selectedDate, hour)}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.backgroundColor = "";
            }}
            onDrop={(e) => {
              e.currentTarget.style.backgroundColor = "";
            }}
          />
        ))}

        {isSameDay(selectedDate, new Date()) && (
          <div className="current-time-line" style={{ top: `${nowTop}px` }} />
        )}

        {currentTasks.map((task) => {
          const { top, height } = getTopHeight(task.startTime, task.endTime);
          const editable = isTaskEditable(task);

          // Check if task is currently active
          const [startH, startM] = task.startTime.split(":").map(Number);
          const [endH, endM] = task.endTime.split(":").map(Number);
          const taskStartMin = startH * 60 + (startM || 0);
          const taskEndMin = endH * 60 + (endM || 0);
          const isToday = isSameDay(selectedDate, new Date());
          const isCurrent = isToday && nowMinutes >= taskStartMin && nowMinutes < taskEndMin && !task.completed;

          return (
            <div
              key={getTaskId(task)}
              className={`task-block ${isCurrent ? "task-current" : ""}`}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: task.completed
                  ? "var(--bg-secondary)"
                  : !isTaskEditable(task)
                    ? "rgba(239, 68, 68, 0.15)"
                    : task.category.color + "33",
                borderLeft: task.completed
                  ? `4px solid var(--bg-tertiary)`
                  : `4px solid ${task.category.color}`,
                opacity: task.completed || !isTaskEditable(task) ? 0.6 : 1,
                cursor: editable ? "grab" : "default",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "start",
                gap: "10px",
              }}
              draggable={editable}
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(task);
              }}
            >
              <div
                className="task-block-title"
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {task.completed ? (
                  <CheckCircle2
                    size={12}
                    style={{ color: "var(--success)", flexShrink: 0 }}
                  />
                ) : (
                  !isTaskEditable(task) && (
                    <X
                      size={12}
                      style={{
                        color: isTaskEditable(task)
                          ? "var(--text-muted)"
                          : "var(--danger)",
                        flexShrink: 0,
                      }}
                    />
                  )
                )}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {task.title}
                </span>
              </div>
              <div
                className="task-block-time"
                style={{
                  flexShrink: 0,
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                {task.startTime} - {task.endTime}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeekGridView = ({
  currentDate,
  selectedDate,
  getTasksByDate,
  handleTimeSlotClick,
  handleTimeDrop,
  handleEditClick,
  handleDragStart,
  handleDragEnd,
  clipboardTasks,
  handleCopyDayTasks,
  handlePasteDayTasks,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const PIXELS_PER_HOUR = 60;
  const [now, setNow] = useState(new Date());

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Vertical scroll to current time
      const nowMins = new Date().getHours() * 60;
      scrollRef.current.scrollTop = Math.max(0, nowMins - 100);

      // Horizontal scroll to center (the 4th day is the center in rolling view)
      const containerWidth = scrollRef.current.offsetWidth;
      const contentWidth = scrollRef.current.scrollWidth;
      if (contentWidth > containerWidth) {
        // center is at 70px (time column) + 400px (middle of 800px grid) = 470px
        // We want 470px at containerWidth / 2
        scrollRef.current.scrollLeft = 470 - containerWidth / 2;
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const HEADER_HEIGHT = 120;

  const weekDays = eachDayOfInterval({
    start: subDays(currentDate, 3),
    end: addDays(currentDate, 3),
  });

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * PIXELS_PER_HOUR;

  return (
    <div
      className="time-grid-container scrollbox"
      style={{ overflowX: "auto", overflowY: "auto" }}
      ref={scrollRef}
    >
      <div
        className="time-column"
        style={{
          position: "sticky",
          left: 0,
          zIndex: 50,
          background: "var(--bg-primary)",
          minWidth: "70px",
          height: "max-content",
          minHeight: "100%",
        }}
      >
        <div
          style={{
            height: HEADER_HEIGHT,
            borderBottom: "1px solid var(--bg-tertiary)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "var(--bg-primary)",
            display: "flex",
            alignItems: "end",
            justifyContent: "center",
            paddingBottom: "0.5rem",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          TIME
        </div>
        {hours.map((hour) => (
          <div key={hour} className="time-label">
            <span className="time-text">
              {format(setHours(new Date(), hour), "h a")}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          minWidth: "800px",
          height: "max-content",
          minHeight: "100%",
        }}
      >
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const dayTasks = getTasksByDate(format(day, "yyyy-MM-dd"));

          return (
            <div
              key={day.toString()}
              style={{
                flex: 1,
                borderRight: "1px solid var(--bg-tertiary)",
                position: "relative",
                minWidth: "100px",
                minHeight: "100%",
              }}
            >
              <div
                style={{
                  height: HEADER_HEIGHT,
                  position: "sticky",
                  top: 0,
                  zIndex: 40,
                  background: isSelected
                    ? "rgba(139, 92, 246, 0.1)"
                    : "var(--bg-primary)",
                  borderBottom: "1px solid var(--bg-tertiary)",
                  padding: "0.5rem",
                  textAlign: "center",
                  borderTop: isToday
                    ? "3px solid var(--primary)"
                    : "3px solid transparent",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: isToday ? "var(--primary)" : "var(--text-primary)",
                  }}
                >
                  {format(day, "d")}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "0.25rem",
                    gap: "0.25rem",
                  }}
                >
                  {clipboardTasks && isAfter(day, startOfToday()) ? (
                    <button
                      className="btn-icon"
                      style={{ padding: "2px", width: "20px", height: "20px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePasteDayTasks(day);
                      }}
                      title="Paste Tasks"
                    >
                      <ClipboardPaste size={12} />
                    </button>
                  ) : (
                    dayTasks.length > 0 && (
                      <button
                        className="btn-icon"
                        style={{
                          padding: "2px",
                          width: "20px",
                          height: "20px",
                        }}
                        disabled={clipboardTasks?.length > 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyDayTasks(day);
                        }}
                        title="Copy Tasks"
                      >
                        <Copy size={12} />
                      </button>
                    )
                  )}
                </div>
              </div>

              <div
                style={{ position: "relative", height: `${24 * 60}px` }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTimeDrop(e, day)}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="grid-hour-row"
                    style={{
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => handleTimeSlotClick(day, hour)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor =
                        "rgba(139, 92, 246, 0.1)";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                    onDrop={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  />
                ))}

                {isToday && (
                  <div
                    className="current-time-line"
                    style={{ top: `${nowTop}px` }}
                  />
                )}

                {dayTasks.map((task) => {
                  const { top, height } = getTopHeight(
                    task.startTime,
                    task.endTime
                  );
                  const editable = isTaskEditable(task);

                  // Check if task is currently active
                  const [startH, startM] = task.startTime.split(":").map(Number);
                  const [endH, endM] = task.endTime.split(":").map(Number);
                  const taskStartMin = startH * 60 + (startM || 0);
                  const taskEndMin = endH * 60 + (endM || 0);
                  const isCurrent = isToday && nowMinutes >= taskStartMin && nowMinutes < taskEndMin && !task.completed;

                  return (
                    <div
                      key={getTaskId(task)}
                      className={`task-block ${isCurrent ? "task-current" : ""}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: task.completed
                          ? "var(--bg-secondary)"
                          : !isTaskEditable(task)
                            ? "rgba(239, 68, 68, 0.15)"
                            : task.category.color + "33",
                        borderLeft: task.completed
                          ? `4px solid var(--bg-tertiary)`
                          : `4px solid ${task.category.color}`,
                        opacity:
                          task.completed || !isTaskEditable(task) ? 0.6 : 1,
                        textDecoration: task.completed
                          ? "line-through"
                          : "none",
                        fontSize: "0.7rem",
                        padding: "2px 4px",
                        left: "2px",
                        right: "2px",
                        width: "auto",
                        cursor: editable ? "grab" : "default",
                      }}
                      draggable={editable}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(task);
                      }}
                      title={`${task.title} (${task.startTime} - ${task.endTime})`}
                    >
                      <div
                        className="task-block-title"
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {task.completed ? (
                          <CheckCircle2
                            size={15}
                            style={{ color: "var(--success)", flexShrink: 0 }}
                          />
                        ) : (
                          !isTaskEditable(task) && (
                            <X
                              size={15}
                              style={{
                                color: isTaskEditable(task)
                                  ? "var(--text-muted)"
                                  : "var(--danger)",
                                flexShrink: 0,
                              }}
                            />
                          )
                        )}
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: "0.75rem",
                          }}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarView = () => {
  const {
    tasks,
    tags,
    toggleTask: contextToggleTask,
    getTasksByDate,
    addTask,
    updateTask,
    deleteTask,
    addTag,
  } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("Week"); // 'Month' or 'Day'

  // Task Input State - Initialize with current hour
  const getCurrentHourTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const startTime = `${currentHour.toString().padStart(2, "0")}:00`;
    const endTime = `${(currentHour + 1).toString().padStart(2, "0")}:00`;
    return { startTime, endTime };
  };

  const { startTime: initialStartTime, endTime: initialEndTime } =
    getCurrentHourTime();
  const [newStartTime, setNewStartTime] = useState(initialStartTime);
  const [newEndTime, setNewEndTime] = useState(initialEndTime);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");

  // Edit Mode State
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Tag Creation State
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Clipboard State
  const [clipboardTasks, setClipboardTasks] = useState(null);

  // Initialize selected tag
  useEffect(() => {
    if (!selectedTagId && tags && tags.length > 0) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // SORTED TASKS FOR SELECTED DATE
  const selectedDateTasks = getTasksByDate(
    format(selectedDate, "yyyy-MM-dd")
  ).sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  const getDayStatus = (date) => {
    const dayTasks = getTasksByDate(format(date, "yyyy-MM-dd"));
    if (dayTasks.length === 0) return null;
    const completed = dayTasks.filter((t) => t.completed).length;
    return { total: dayTasks.length, completed };
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const nextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    if (viewMode === "Day") setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    if (viewMode === "Day") setCurrentDate(prev);
  };

  const nextWeek = () => {
    const next = addWeeks(currentDate, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const prevWeek = () => {
    const prev = subWeeks(currentDate, 1);
    setCurrentDate(prev);
    setSelectedDate(prev);
  };

  const handleTimeSlotClick = (date, hour) => {
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

    setSelectedDate(date);

    // Populate form
    setNewStartTime(startTime);
    setNewEndTime(endTime);
    setEditingTaskId(null);
    setNewTaskTitle("");

    // Focus input
    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="Add new task..."]'
      );
      if (input) input.focus();
    }, 50);
  };

  // Prepare Edit
  const handleEditClick = (task) => {
    if (!isTaskEditable(task)) {
        alert("This task is locked and cannot be edited.");
        return;
    }

    setEditingTaskId(getTaskId(task));
    setNewTaskTitle(task.title);
    setNewStartTime(task.startTime || "09:00");
    setNewEndTime(task.endTime || "10:00");
    setSelectedTagId(task.category.id);

    // Update selected date to task's date
    if (task.date) {
      setSelectedDate(parse(task.date, "yyyy-MM-dd", new Date()));
    }

    // Focus input
    const input = document.querySelector(
      'input[placeholder="Add new task..."]'
    );
    if (input) input.focus();
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTaskTitle("");
    const { startTime, endTime } = getCurrentHourTime();
    setNewStartTime(startTime);
    setNewEndTime(endTime);
    if (tags.length > 0) setSelectedTagId(tags[0].id);
  };

  const handleSaveTask = () => {
    if (!newTaskTitle.trim()) return;

    let tagToUse = tags.find((t) => t.id === selectedTagId);
    if (!tagToUse && tags.length > 0) tagToUse = tags[0];

    // Default tag if none exists
    if (!tagToUse) {
      tagToUse = { id: "work", label: "Work", color: "#3b82f6" };
    }

    if (editingTaskId) {
      // Update Existing
      const existingTask = tasks.find((t) => getTaskId(t) === editingTaskId);
      const updatedTask = {
        ...existingTask,
        title: newTaskTitle,
        category: tagToUse,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      updateTask(updatedTask);
      setEditingTaskId(null);
    } else {
      // Create New - MongoDB will assign _id
      const newTask = {
        title: newTaskTitle,
        category: tagToUse,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: newStartTime,
        endTime: newEndTime,
        completed: false,
        type: "task",
      };
      addTask(newTask);
    }

    // Reset form to current hour
    setNewTaskTitle("");
    const { startTime, endTime } = getCurrentHourTime();
    setNewStartTime(startTime);
    setNewEndTime(endTime);
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => getTaskId(t) === taskId);
    if (task && !isTaskEditable(task)) {
        alert("This task is locked and cannot be deleted.");
        return;
    }

    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId);
      if (editingTaskId === taskId) {
        handleCancelEdit();
      }
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const id = newTagName.toLowerCase().replace(/\s+/g, "-");
    const newTag = {
      id,
      label: newTagName,
      color: "#3b82f6", // Default blue
    };
    addTag(newTag);
    setSelectedTagId(id);
    setIsCreatingTag(false);
    setNewTagName("");
  };

  const handleToggleTask = (task) => {
    if (!isTaskEditable(task)) {
        alert("This task is locked and cannot be updated.");
        return;
    }

    const taskId = getTaskId(task);
    const wasCompleted = task.completed;

    contextToggleTask(taskId);

    if (!wasCompleted) {
    //   confetti({
    //     particleCount: 300,
    //     spread: 100,
    //     origin: { y: 0.6 },
    //   });
      var count = 200;
      var defaults = {
        origin: { y: 0.7 },
      };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });

      var defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
      };

      function shoot() {
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ["star"],
        });

        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ["circle"],
        });
      }

      setTimeout(shoot, 0);
      setTimeout(shoot, 100);
      setTimeout(shoot, 200);
    }
  };

  const handleCopyDayTasks = (date) => {
    const tasksToCopy = getTasksByDate(format(date, "yyyy-MM-dd"));
    if (tasksToCopy.length === 0) return;
    setClipboardTasks(tasksToCopy);
  };

  const handlePasteDayTasks = (targetDate) => {
    if (!clipboardTasks || clipboardTasks.length === 0) return;

    clipboardTasks.forEach((task) => {
      // Remove _id and id fields - MongoDB will assign new _id
      const { _id, id, ...taskWithoutId } = task;
      const newTask = {
        ...taskWithoutId,
        date: format(targetDate, "yyyy-MM-dd"),
        completed: false,
      };
      addTask(newTask);
    });
    setClipboardTasks(null); // Clear after paste? Or keep it? Let's clear for now to avoid accidental multiple pastes
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e, task) => {
    if (!isTaskEditable(task)) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData("taskId", getTaskId(task));
    e.dataTransfer.effectAllowed = "move";

    // Calculate offset from top of task element (assuming 1px = 1min)
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMinutes = e.clientY - rect.top;
    e.dataTransfer.setData("dragOffset", offsetMinutes.toString());

    // Hack to make the dragged element a bit transparent so we can see grid behind
    if (e.target) e.target.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    if (e.target) e.target.style.opacity = "";
  };

  const handleTimeDrop = (e, targetDate) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => getTaskId(t) === taskId);
    if (!task) return;

    // Additional check for drop target, though mostly redundant if start was blocked
    const targetDateObj = new Date(targetDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (targetDateObj < today) {
        alert("Cannot move task to a past date.");
        return;
    }

    // Calculate Y position relative to the container
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top; // Relative to viewport top, compensated by rect.top

    // Get the offset within the task that we grabbed
    const dragOffset = parseInt(
      e.dataTransfer.getData("dragOffset") || "0",
      10
    );

    // 1px = 1 minute (PIXELS_PER_HOUR = 60)
    // Calculate the theoretical top of the element, not the cursor position
    const minutesRaw = offsetY - dragOffset;

    // Snap to nearest 15 minutes
    const minutesSnapped = Math.round(minutesRaw / 15) * 15;

    // Ensure we don't go negative
    if (minutesSnapped < 0) return;

    const newStartH = Math.floor(minutesSnapped / 60);
    const newStartM = minutesSnapped % 60;

    // Calculate duration to preserve it
    const [oldStartH, oldStartM] = task.startTime.split(":").map(Number);
    const [oldEndH, oldEndM] = task.endTime.split(":").map(Number);
    const durationMinutes =
      oldEndH * 60 + oldEndM - (oldStartH * 60 + oldStartM);

    const newEndTotalMins = minutesSnapped + durationMinutes;
    const newEndH = Math.floor(newEndTotalMins / 60);
    const newEndM = newEndTotalMins % 60;

    // Cap at midnight (1440 mins)
    if (newEndTotalMins > 1440) return;

    const formatTime = (h, m) =>
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

    const updatedTask = {
      ...task,
      date: format(targetDate, "yyyy-MM-dd"),
      startTime: formatTime(newStartH, newStartM),
      endTime: formatTime(newEndH, newEndM),
    };

    updateTask(updatedTask);
  };

  // --- Render Components ---

  const MonthGridView = () => (
    <div className="month-view-container">
      <div className="days-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="days-grid">
        {days.map((day) => {
          const status = getDayStatus(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          let dayClass = "day-cell";
          if (isSelected) dayClass += " selected";
          if (isToday) dayClass += " today";
          if (!isCurrentMonth) dayClass += " faded";

          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={dayClass}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleTimeDrop(e, day)}
            >
              <div
                className="flex-between"
                style={{ alignItems: "flex-start" }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: isToday ? "var(--primary)" : "inherit",
                  }}
                >
                  {format(day, "d")}
                </span>
              </div>

              {status && (
                <>
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "var(--bg-primary)",
                      borderRadius: "999px",
                      height: "0.375rem",
                      marginTop: "0.5rem",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        backgroundColor: "var(--success)",
                        width: `${(status.completed / status.total) * 100}%`,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs text-muted"
                    style={{
                      display: "block",
                      textAlign: "right",
                      marginTop: "0.25rem",
                    }}
                  >
                    {status.completed}/{status.total}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="calendar-layout">
      {/* Calendar Section */}
      <div className="calendar-main">
        <header className="flex-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {viewMode === "Month" && format(currentDate, "MMMM yyyy")}
              {viewMode === "Week" &&
                `${format(subDays(currentDate, 3), "MMM d")} - ${format(
                  addDays(currentDate, 3),
                  "MMM d, yyyy",
                )}`}
              {viewMode === "Day" && format(selectedDate, "MMM d, yyyy")}
            </h2>
            <p className="text-muted">
              {viewMode === "Month" && "Select a date to view tasks"}
              {viewMode === "Week" && "Weekly overview"}
              {viewMode === "Day" && "Daily timeline"}
            </p>
          </div>
          <div
            className="flex gap-4 items-center"
            style={{ display: "flex", gap: "1rem", alignItems: "center" }}
          >
            <select
              className="view-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="Month">Month View</option>
              <option value="Week">Week View</option>
              <option value="Day">Day View</option>
            </select>

            <div className="calendar-controls">
              <button
                onClick={
                  viewMode === "Month"
                    ? prevMonth
                    : viewMode === "Week"
                      ? prevWeek
                      : prevDay
                }
                className="btn-icon"
              >
                <ChevronLeft />
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDate(now);
                }}
                className="btn-sm"
              >
                Today
              </button>

              <button
                onClick={
                  viewMode === "Month"
                    ? nextMonth
                    : viewMode === "Week"
                      ? nextWeek
                      : nextDay
                }
                className="btn-icon"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </header>

        {viewMode === "Month" && <MonthGridView />}
        {viewMode === "Week" && (
          <WeekGridView
            currentDate={currentDate}
            selectedDate={selectedDate}
            getTasksByDate={getTasksByDate}
            handleTimeSlotClick={handleTimeSlotClick}
            handleTimeDrop={handleTimeDrop}
            handleEditClick={handleEditClick}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            clipboardTasks={clipboardTasks}
            handleCopyDayTasks={handleCopyDayTasks}
            handlePasteDayTasks={handlePasteDayTasks}
          />
        )}
        {viewMode === "Day" && (
          <DayTimeGridView
            selectedDate={selectedDate}
            getTasksByDate={getTasksByDate}
            handleTimeSlotClick={handleTimeSlotClick}
            handleTimeDrop={handleTimeDrop}
            handleEditClick={handleEditClick}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
          />
        )}
      </div>

      {/* Daily Tasks Sidebar (Right) */}
      <aside className="task-sidebar">
        <div className="mb-4">
          <h3 className="text-xl font-bold">
            {format(selectedDate, "EEEE, MMMM do")}
          </h3>
          <p className="text-sm text-muted">
            {selectedDateTasks.length} Tasks Scheduled
          </p>
        </div>

        {/* Task Form (Add/Edit) */}
        <div className="task-input-wrapper">
          {editingTaskId && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
                alignItems: "center",
              }}
            >
              <span className="text-xs text-primary font-bold uppercase tracking-wider">
                Editing Task
              </span>
              <button
                onClick={handleCancelEdit}
                className="text-xs text-muted hover:text-danger flex items-center gap-1"
              >
                <RotateCcw size={12} /> Cancel
              </button>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "0.25rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--bg-tertiary)",
              }}
            >
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="input-reset"
                style={{ width: "auto", fontSize: "0.75rem" }}
              />
            </div>
            <span className="text-muted">-</span>
            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "0.25rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--bg-tertiary)",
              }}
            >
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="input-reset"
                style={{ width: "auto", fontSize: "0.75rem" }}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder={
              editingTaskId ? "Update task title..." : "Add new task..."
            }
            className="input-reset"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTask();
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            {!isCreatingTag ? (
              <>
                <select
                  className="input-reset"
                  style={{
                    width: "auto",
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreatingTag(true)}
                  className="text-xs text-muted hover:text-primary"
                  title="Create new tag"
                >
                  <Plus size={16} />
                </button>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  className="input-reset"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem",
                    borderBottom: "1px solid var(--primary)",
                  }}
                  placeholder="New Tag Name"
                  autoFocus
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag();
                    if (e.key === "Escape") setIsCreatingTag(false);
                  }}
                />
                <button
                  onClick={handleCreateTag}
                  className="text-[var(--success)]"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button
                  onClick={() => setIsCreatingTag(false)}
                  className="text-[var(--danger)]"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <button
              onClick={handleSaveTask}
              className=""
              style={{
                marginLeft: "auto",
                background: editingTaskId ? "var(--primary)" : "var(--primary)",
                color: editingTaskId ? "white" : "white",
                border: "none",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "0.75rem",
              }}
            >
              {editingTaskId ? "Update" : "Add"}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
          className="scrollbox"
        >
          {selectedDateTasks.length > 0 ? (
            selectedDateTasks.map((task) => {
              const isMissed = !task.completed && !isTaskEditable(task);
              return (
                <div
                  key={getTaskId(task)}
                  className={`task-item ${
                    task.completed ? "task-completed" : ""
                  } ${isMissed ? "task-missed" : ""}`}
                >
                  <button
                    onClick={() => handleToggleTask(task)}
                    style={{
                      color: task.completed
                        ? "var(--success)"
                        : isMissed
                          ? "var(--danger)"
                          : "var(--text-muted)",
                    }}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={20} />
                    ) : isMissed ? (
                      <X size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <p className="task-title" style={{ fontWeight: 500 }}>
                        {task.title}
                      </p>
                      {task.startTime && (
                        <span
                          className="text-xs text-muted"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Clock size={10} /> {task.startTime} - {task.endTime}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="badge"
                        style={{
                          backgroundColor: task.category.color,
                          color: "white",
                        }}
                      >
                        {task.category.label}
                      </span>

                      <button
                        onClick={() => handleEditClick(task)}
                        className="text-muted hover:text-primary ml-auto"
                        style={{ marginLeft: "auto", padding: "4px" }}
                        title="Edit Task"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(getTaskId(task))}
                        className="text-muted hover:text-danger"
                        style={{ padding: "4px" }}
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="text-center text-muted"
              style={{ padding: "2.5rem 0" }}
            >
              <p>No tasks for this day.</p>
              <button
                onClick={() => {
                  handleSaveTask();
                  //   document
                  //     .querySelector('input[placeholder="Add new task..."]')
                  //     .focus()
                }}
                className="mt-4"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  backgroundColor: "var(--primary)",
                  color: "white",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                Add Task
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default CalendarView;
