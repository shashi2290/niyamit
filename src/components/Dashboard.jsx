import { useState, useMemo, Fragment } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,

    PieChart, Pie, Cell, BarChart, Bar, ComposedChart
} from 'recharts';
import { TrendingUp, AlertCircle, Award, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import {
    format, subDays, isSameDay, startOfDay, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths,
    addWeeks, subWeeks, addDays, subDays as dateFnsSubDays, getHours, parse
} from 'date-fns';

const ActivityHeatmap = ({ tasks, today }) => {
    // Generate last 365 days
    const days = eachDayOfInterval({
        start: subDays(today, 364),
        end: today
    });

    // Group by weeks (Sunday start)
    const weeks = [];
    const startDay = days[0].getDay();
    let currentWeek = Array(startDay).fill(null);

    days.forEach((day) => {
        const dayOfWeek = day.getDay(); // 0 = Sun, 6 = Sat
        if (dayOfWeek === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Calculate intensity for each day
    const getColor = (level) => {
        switch(level) {
            case 0: return '#161b22'; // GitHub Dark Empty
            case 1: return '#0e4429'; // Low
            case 2: return '#006d32'; // Medium-Low
            case 3: return '#26a641'; // Medium-High
            case 4: return '#39d353'; // High
            default: return '#161b22';
        }
    };

    const monthLabels = [];
    let currentMonthEntry = null;

    weeks.forEach((week, wIdx) => {
        const firstDay = week.find(d => d);
        const month = firstDay ? firstDay.getMonth() : -1;
        const prevWeek = wIdx > 0 ? weeks[wIdx - 1] : null;
        const prevFirstDay = prevWeek ? prevWeek.find(d => d) : null;
        const prevMonth = prevFirstDay ? prevFirstDay.getMonth() : -1;

        if (month !== prevMonth) {
            if (currentMonthEntry) {
                currentMonthEntry.endIndex = wIdx;
                monthLabels.push(currentMonthEntry);
            }
            currentMonthEntry = {
                startIndex: wIdx,
                label: format(firstDay || new Date(), 'MMM')
            };
        }
    });
    
    // Add the last month
    if (currentMonthEntry) {
        currentMonthEntry.endIndex = weeks.length;
        monthLabels.push(currentMonthEntry);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="glass-panel mb-4">
        <h3 className="text-lg font-bold mb-4">Activity Heatmap</h3>
        <div className="heatmap-container">
          <div className="">
            <div
              className="heatmap-months-row"
              style={{
                position: "relative",
                height: "20px",
                marginBottom: "4px",
                display: "block",
                marginLeft: "32px",
                width: "calc(100% - 32px)",
              }}
            >
              {monthLabels.map((ml, idx) => {
                const centerIndex = (ml.startIndex + ml.endIndex) / 2;
                return (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${(centerIndex / weeks.length) * 100}%`,
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                      transform: "translateX(-50%)",
                    }}
                  >
                    {ml.label}
                  </div>
                );
              })}
            </div>
            <div
              className="heatmap-grid"
              style={{
                display: "grid",
                width: "100%",
                gap: "2px",
                gridTemplateColumns: `30px repeat(${weeks.length}, 1fr)`,
                gridTemplateRows: "repeat(7, 1fr)",
                gridAutoFlow: "column",
              }}
            >
              {/* Day Labels */}
              {weekDays.map((day, idx) => (
                <div
                  key={`label-${idx}`}
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  {day}
                </div>
              ))}

              {weeks.map((week, wIdx) => (
                <Fragment key={wIdx}>
                  {week.map((day, dIdx) => {
                    if (!day) return <div key={`empty-${wIdx}-${dIdx}`} />;

                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayTasks = tasks.filter((t) => t.date === dateStr);
                    const total = dayTasks.length;
                    const completed = dayTasks.filter(
                      (t) => t.completed,
                    ).length;

                    let level = 0;
                    if (total > 0) {
                      const rate = completed / total;
                      if (rate === 1) level = 4;
                      else if (rate >= 0.66) level = 3;
                      else if (rate >= 0.33) level = 2;
                      else level = 1;
                    }

                    return (
                      <div
                        key={dIdx}
                        className="heatmap-cell tooltip-container"
                        style={{
                          backgroundColor: getColor(level),
                          width: "100%",
                          aspectRatio: "1",
                          borderRadius: "2px",
                        }}
                        // title={`${format(day, "MMM d, yyyy")}: ${completed}/${total} completed`}
                        data-tooltip={`${format(day, "MMM d, yyyy")}: ${completed}/${total} completed`}
                        data-direction="left"
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
};

const Dashboard = () => {
    const { tasks } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('Week'); // 'Month', 'Week', 'Day'

    const today = startOfDay(new Date());

    // Navigation Handlers
    const nextPeriod = () => {
        if (viewMode === 'Month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'Week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prevPeriod = () => {
        if (viewMode === 'Month') setCurrentDate(subMonths(currentDate, 1));
        else if (viewMode === 'Week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(dateFnsSubDays(currentDate, 1));
    };

    const jumpToToday = () => setCurrentDate(new Date());

    const stats = useMemo(() => {
        let chartData = [];
        let rangeStart, rangeEnd;
        let rangeTasks = [];

        // 1. Prepare Chart Data based on View Mode
        if (viewMode === 'Month') {
            rangeStart = startOfMonth(currentDate);
            rangeEnd = endOfMonth(currentDate);
            const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

            // Calculate rangeTasks for analytics
            rangeTasks = tasks.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= rangeStart && tDate <= rangeEnd;
            });

            chartData = days.map(date => {
                const dayStr = format(date, 'yyyy-MM-dd');
                const dayTasks = tasks.filter(t => t.date === dayStr);
                const total = dayTasks.length;
                const completed = dayTasks.filter(t => t.completed).length;
                return {
                    dateLabel: format(date, 'd'),
                    fullDate: date,
                    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
                    total,
                    completed,
                    missed: total - completed
                };
            });
        } else if (viewMode === 'Week') {
            rangeStart = startOfWeek(currentDate);
            rangeEnd = endOfWeek(currentDate);
            const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

            rangeTasks = tasks.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= rangeStart && tDate <= rangeEnd;
            });

            chartData = days.map(date => {
                const dayStr = format(date, 'yyyy-MM-dd');
                const dayTasks = tasks.filter(t => t.date === dayStr);
                const total = dayTasks.length;
                const completed = dayTasks.filter(t => t.completed).length;
                return {
                    dateLabel: format(date, 'EEE'),
                    fullDate: date,
                    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
                    total,
                    completed,
                    missed: total - completed
                };
            });
        } else if (viewMode === 'Day') {
            // Day View: Task Timeline
            const dayStr = format(currentDate, 'yyyy-MM-dd');
            rangeTasks = tasks.filter(t => t.date === dayStr); // For pie/missed list
            
            const parseTime = (timeStr) => {
                if (!timeStr) return 0;
                const [h, m] = timeStr.split(':').map(Number);
                return h + (m / 60);
            };

            chartData = rangeTasks.map(t => {
                const start = parseTime(t.startTime);
                const end = parseTime(t.endTime);
                let duration = end - start;
                // Handle crossing midnight simply
                if (duration < 0) duration += 24;

                return {
                    name: t.title,
                    start: start,
                    duration: duration,
                    end: end,
                    completed: t.completed,
                    color: t.category?.color || '#3b82f6',
                    fullTask: t,
                    total: 1 // For consistent reducing later
                };
            }).sort((a, b) => a.start - b.start);
        }

        // 2. Category Breakdown (Pie) - Already have rangeTasks
        const categoryStats = {};
        rangeTasks.forEach(t => {
            if (!t.category) return;
            const catLabel = t.category.label;
            const catColor = t.category.color;
            
            if (!categoryStats[catLabel]) {
                categoryStats[catLabel] = { count: 0, color: catColor };
            }
            categoryStats[catLabel].count++;
        });
        
        const pieData = Object.keys(categoryStats).map(key => ({
            name: key, 
            value: categoryStats[key].count,
            color: categoryStats[key].color || '#3b82f6'
        }));
        
        if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1, color: '#e5e7eb' });


        // 3. Attention Needed (Missed Tasks)
        let missedList = [];
        
        const uncompletedInPeriod = rangeTasks.filter(t => {
            const tDate = parse(t.date, 'yyyy-MM-dd', new Date());
            tDate.setHours(0, 0, 0, 0);
            
            // Ignore future tasks for "Missed" list
            if (tDate > today) return false;

            if (isSameDay(tDate, today)) {
                if (t.completed) return false;
                if (!t.endTime) return false; // Tasks without time are not missed until day ends? Or treat as never missed today.

                const now = new Date();
                const [h, m] = t.endTime.split(':').map(Number);
                const taskEnd = new Date(today);
                taskEnd.setHours(h, m, 0, 0);
                
                // Missed if 3 hours passed since end time
                const missThreshold = new Date(taskEnd.getTime() + 3 * 60 * 60 * 1000);
                return now > missThreshold;
            }

            return !t.completed;
        });

        if (viewMode === 'Day') {
            // List individual tasks
            missedList = uncompletedInPeriod.map(t => ({
                name: t.title,
                count: 1 // Just for consistent API
            }));
        } else {
            // Aggregate
            const missedCounts = {};
            uncompletedInPeriod.forEach(t => {
                const label = t.category?.label || t.title;
                if (!missedCounts[t.category?.label])
                  missedCounts[t.category?.label] = 0;
                missedCounts[t.category?.label]++;
            });
            missedList = Object.entries(missedCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count]) => ({ name, count }));
        }

        // 4. Streak Calculation
        let streak = 0;
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = subDays(today, 29 - i);
            const dayStr = format(date, 'yyyy-MM-dd');
            const dayTasks = tasks.filter(t => t.date === dayStr);
            const total = dayTasks.length;
            const completed = dayTasks.filter(t => t.completed).length;
            return {
                fullDate: date,
                rate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });

        for (let i = last30Days.length - 1; i >= 0; i--) {
            if (isSameDay(last30Days[i].fullDate, today)) continue;
            if (last30Days[i].rate >= 80) {
                streak++;
            } else {
                break;
            }
        }

        // 5. Today's Progress (Always for Today, strictly today in real-time)
        const todayStr = format(today, 'yyyy-MM-dd');
        const todayTasks = tasks.filter(t => t.date === todayStr);
        const todayCompleted = todayTasks.filter(t => t.completed).length;
        const todayRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

        return {
            chartData,
            pieData,
            missedList,
            streak,
            todayRate,
            todayTotal: todayTasks.length
        };
    }, [tasks, currentDate, viewMode, today]);

    const getTitle = () => {
        if (viewMode === 'Month') return format(currentDate, 'MMMM yyyy');
        if (viewMode === 'Week') return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`;
        return format(currentDate, 'MMMM do, yyyy');
    };

    return (
      <div className="page-container">
        <header className="page-header">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted">Analytics for {getTitle()}</p>
          </div>

          <div
            className="flex gap-4 items-center"
            style={{ display: "flex", gap: "1rem", alignItems: "center" }}
          >
            <div className="calendar-controls" style={{ marginRight: "1rem" }}>
              <button onClick={prevPeriod} className="btn-icon">
                <ChevronLeft />
              </button>
              <button onClick={jumpToToday} className="btn-sm">
                Today
              </button>
              <button onClick={nextPeriod} className="btn-icon">
                <ChevronRight />
              </button>
            </div>

            <select
              className="view-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="Month">Month View</option>
              <option value="Week">Week View</option>
              <option value="Day">Day View</option>
            </select>

            <div
              className="text-right"
              style={{
                borderLeft: "1px solid var(--bg-tertiary)",
                paddingLeft: "1rem",
              }}
            >
              <p className="text-sm text-muted">Current Streak</p>
              <div className="streak-badge">
                <Award size={24} /> {stats.streak} Days
              </div>
            </div>
          </div>
        </header>

        {/* Top Stats Cards */}
        <div className="stats-grid">
          <div
            className="glass-panel"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                padding: "1rem",
                opacity: 0.1,
              }}
            >
              <CheckCircle2 size={100} />
            </div>
            <h3 className="text-muted font-bold mb-4">Today's Focus</h3>
            <div
              style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}
            >
              <span className="text-2xl font-bold">{stats.todayRate}%</span>
              <span className="text-sm text-muted">Completed</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${stats.todayRate}%` }}
              ></div>
            </div>
          </div>
          <div className="glass-panel">
            <h3 className="text-muted font-bold mb-4">Attention Needed</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {stats.missedList.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <AlertCircle size={18} style={{ color: "var(--danger)" }} />
                  <span className="text-sm">{item.name}</span>
                  <span
                    className="badge"
                    style={{
                      marginLeft: "auto",
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    {item.count} missed
                  </span>
                </div>
              ))}
              {stats.missedList.length === 0 && (
                <p className="text-sm" style={{ color: "var(--success)" }}>
                  No missed tasks recently!
                </p>
              )}
            </div>
          </div>
          <div
            className="glass-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h3 className="text-muted font-bold mb-4">Total Tasks in Period</h3>
            <p className="text-2xl font-bold">
              {stats.chartData.reduce(
                (acc, curr) => acc + (curr.total || 0),
                0,
              )}
            </p>
            <p className="text-xs text-muted mt-4">
              For selected {viewMode.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Activity Heatmap (Visible in Week View) */}
        {viewMode === "Week" && <ActivityHeatmap tasks={tasks} today={today} />}

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Main Chart */}
          <div className="glass-panel">
            <h3 className="text-lg font-bold mb-4">
              {viewMode === "Day"
                ? "Hourly Activity"
                : "Completion Consistency"}
            </h3>
            <div style={{ height: "500px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === "Day" ? (
                  <BarChart
                    layout="vertical"
                    data={stats.chartData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--bg-tertiary)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 24]}
                      ticks={[0, 4, 8, 12, 16, 20, 24]}
                      tickFormatter={(tick) => {
                        if (tick === 0 || tick === 24) return "12 AM";
                        if (tick === 12) return "12 PM";
                        return tick > 12 ? `${tick - 12} PM` : `${tick} AM`;
                      }}
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "var(--bg-secondary)" }}
                      contentStyle={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--glass-border)",
                        color: "white",
                      }}
                      formatter={(value, name) => [
                        name === "duration" ? `${value.toFixed(1)} hrs` : value,
                        name === "start" ? "Start Time" : name,
                      ]}
                      labelStyle={{ color: "var(--primary)" }}
                    />
                    <Bar dataKey="start" stackId="a" fill="transparent" />
                    <Bar
                      dataKey="duration"
                      stackId="a"
                      name="Duration"
                      radius={[0, 4, 4, 0]}
                    >
                      {stats.chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={entry.completed ? 0.3 : 1}
                          stroke={!entry.completed ? entry.color : "none"}
                          strokeWidth={0.5}
                          strokeDasharray={!entry.completed ? "4 4" : "0"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <ComposedChart data={stats.chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--bg-tertiary)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dateLabel"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={10}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--glass-border)",
                        color: "white",
                      }}
                      itemStyle={{ color: "var(--primary)" }}
                      formatter={(value, name) => {
                        if (name === "completed") return [value, "Completed"];
                        if (name === "missed") return [value, "Missed"];
                        if (name === "rate")
                          return [`${value}%`, "Completion Rate"];
                        return [value, name];
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill="#10b981"
                      yAxisId="left"
                      name="completed"
                    />
                    <Bar
                      dataKey="missed"
                      stackId="a"
                      fill="#ef4444"
                      yAxisId="left"
                      name="missed"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rate"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#8b5cf6", stroke: "white" }}
                      name="rate"
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="glass-panel">
            <h3 className="text-lg font-bold mb-4">Focus Areas ({viewMode})</h3>
            <div style={{ height: "300px", width: "100%" }}>
              {stats.pieData[0]?.name === "No Data" ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No tasks in this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--primary)",
                        borderColor: "var(--glass-border)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {stats.pieData[0]?.name !== "No Data" && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                {stats.pieData.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <div
                      style={{
                        width: "0.5rem",
                        height: "0.5rem",
                        borderRadius: "50%",
                        backgroundColor: entry.color,
                      }}
                    ></div>
                    <span className="text-xs text-muted">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default Dashboard;
