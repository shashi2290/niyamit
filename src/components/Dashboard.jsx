import { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { TrendingUp, AlertCircle, Award, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import {
    format, subDays, isSameDay, startOfDay, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths,
    addWeeks, subWeeks, addDays, subDays as dateFnsSubDays, getHours, parse
} from 'date-fns';

const Dashboard = () => {
    const { tasks } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('Month'); // 'Month', 'Week', 'Day'

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

        // 1. Prepare Chart Data based on View Mode
        if (viewMode === 'Month') {
            rangeStart = startOfMonth(currentDate);
            rangeEnd = endOfMonth(currentDate);
            const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

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
                    completed
                };
            });
        } else if (viewMode === 'Week') {
            rangeStart = startOfWeek(currentDate);
            rangeEnd = endOfWeek(currentDate);
            const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

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
                    completed
                };
            });
        } else if (viewMode === 'Day') {
            // Day View: Hourly Breakdown
            rangeStart = startOfDay(currentDate);
            rangeEnd = rangeStart; // Same day
            const hours = Array.from({ length: 24 }, (_, i) => i);
            const dayStr = format(currentDate, 'yyyy-MM-dd');
            const dayTasks = tasks.filter(t => t.date === dayStr);

            chartData = hours.map(hour => {
                // Filter tasks active in this hour
                const activeInHour = dayTasks.filter(t => {
                    if (!t.startTime) return false;
                    const [startH] = t.startTime.split(':').map(Number);
                    // For simplicity, count task if it starts in this hour
                    return startH === hour;
                });
                const completedInHour = activeInHour.filter(t => t.completed).length;

                return {
                    dateLabel: format(new Date().setHours(hour), 'h a'),
                    fullDate: new Date(currentDate).setHours(hour),
                    total: activeInHour.length, // Using total tasks as value instead of rate for hourly
                    completed: completedInHour,
                    rate: activeInHour.length > 0 ? (completedInHour / activeInHour.length) * 100 : 0
                };
            });
        }

        // 2. Category Breakdown (Pie) - Filtered by current view range
        // For Pie chart, we want aggregates over the selected period
        let rangeTasks = [];
        if (viewMode === 'Day') {
            rangeTasks = tasks.filter(t => t.date === format(currentDate, 'yyyy-MM-dd'));
        } else {
            // For Week/Month, check if date is within interval
            rangeTasks = tasks.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= rangeStart && tDate <= rangeEnd;
            });
        }

        const categoryCounts = {};
        rangeTasks.forEach(t => {
            if (!t.category) return; // Guard against missing category
            const cat = t.category.label;
            if (!categoryCounts[cat]) categoryCounts[cat] = 0;
            categoryCounts[cat]++;
        });
        const pieData = Object.keys(categoryCounts).map(key => ({
            name: key, value: categoryCounts[key]
        }));
        if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1 }); // Placeholder


        // 3. Most Missed Habits (Analysis) - Global
        const pastTasks = tasks.filter(t => new Date(t.date) < today);
        const missedCounts = {};
        pastTasks.forEach(t => {
            if (!t.completed) {
                if (!missedCounts[t.title]) missedCounts[t.title] = 0;
                missedCounts[t.title]++;
            }
        });
        const missedList = Object.entries(missedCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));


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

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#e5e7eb'];

    const getTitle = () => {
        if (viewMode === 'Month') return format(currentDate, 'MMMM yyyy');
        if (viewMode === 'Week') return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`;
        return format(currentDate, 'MMMM do, yyyy');
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">
                        Dashboard
                    </h1>
                    <p className="text-muted">Analytics for {getTitle()}</p>
                </div>

                <div className="flex gap-4 items-center" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="calendar-controls" style={{ marginRight: '1rem' }}>
                        <button onClick={prevPeriod} className="btn-icon"><ChevronLeft /></button>
                        <button onClick={jumpToToday} className="btn-sm">Today</button>
                        <button onClick={nextPeriod} className="btn-icon"><ChevronRight /></button>
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

                    <div className="text-right" style={{ borderLeft: '1px solid var(--bg-tertiary)', paddingLeft: '1rem' }}>
                        <p className="text-sm text-muted">Current Streak</p>
                        <div className="streak-badge">
                            <Award size={24} /> {stats.streak} Days
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Stats Cards */}
            <div className="stats-grid">
                <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, padding: '1rem', opacity: 0.1 }}>
                        <CheckCircle2 size={100} />
                    </div>
                    <h3 className="text-muted font-bold mb-4">Today's Focus</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span className="text-2xl font-bold">{stats.todayRate}%</span>
                        <span className="text-sm text-muted">Completed</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${stats.todayRate}%` }}></div>
                    </div>
                </div>

                <div className="glass-panel">
                    <h3 className="text-muted font-bold mb-4">Attention Needed</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stats.missedList.slice(0, 2).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
                                <span className="text-sm">{item.name}</span>
                                <span className="badge" style={{ marginLeft: 'auto', background: 'var(--bg-tertiary)' }}>{item.count} missed</span>
                            </div>
                        ))}
                        {stats.missedList.length === 0 && <p className="text-sm" style={{ color: 'var(--success)' }}>No missed tasks recently!</p>}
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 className="text-muted font-bold mb-4">Total Tasks in Period</h3>
                    <p className="text-2xl font-bold">
                        {stats.chartData.reduce((acc, curr) => acc + (curr.total || 0), 0)}
                    </p>
                    <p className="text-xs text-muted mt-4">For selected {viewMode.toLowerCase()}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* Main Chart */}
                <div className="glass-panel">
                    <h3 className="text-lg font-bold mb-4">
                        {viewMode === 'Day' ? 'Hourly Activity' : 'Completion Consistency'}
                    </h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            {viewMode === 'Day' ? (
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" vertical={false} />
                                    <XAxis
                                        dataKey="dateLabel"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'var(--bg-tertiary)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'white' }}
                                    />
                                    <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Tasks" />
                                </BarChart>
                            ) : (
                                <LineChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" vertical={false} />
                                    <XAxis
                                        dataKey="dateLabel"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={10}
                                    />
                                    <YAxis
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        unit="%"
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'white' }}
                                        itemStyle={{ color: 'var(--primary)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white' }}
                                        name="Completion Rate"
                                    />
                                </LineChart>
                            )}

                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="glass-panel">
                    <h3 className="text-lg font-bold mb-4">Focus Areas ({viewMode})</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        {stats.pieData[0]?.name === 'No Data' ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
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
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {stats.pieData[0]?.name !== 'No Data' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                            {stats.pieData.map((entry, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
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
