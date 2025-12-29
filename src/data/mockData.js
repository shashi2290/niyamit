import { startOfMonth, endOfMonth, eachDayOfInterval, format, subDays, isSameDay } from 'date-fns';

export const CATEGORIES = {
    HEALTH: { id: 'health', label: 'Health', color: '#10b981' }, // Emerald
    WORK: { id: 'work', label: 'Work', color: '#3b82f6' }, // Blue
    STUDY: { id: 'study', label: 'Study', color: '#8b5cf6' }, // Violet
    HOME: { id: 'home', label: 'Home', color: '#f59e0b' }, // Amber
    SOCIAL: { id: 'social', label: 'Social', color: '#ec4899' }, // Pink
};

const HABITS = [
    { title: 'Morning Meditation', category: 'HEALTH' },
    { title: '30m Exercise', category: 'HEALTH' },
    { title: 'Read 20 pages', category: 'STUDY' },
    { title: 'Cook Dinner', category: 'HOME' },
];

const TASKS_POOL = [
    { title: 'Team Standup', category: 'WORK' },
    { title: 'Complete Project Report', category: 'WORK' },
    { title: 'Online Course: React Adv', category: 'STUDY' },
    { title: 'Grocery Shopping', category: 'HOME' },
    { title: 'Call Mom', category: 'SOCIAL' },
    { title: 'Pay Bills', category: 'HOME' },
    { title: 'Review PRs', category: 'WORK' },
    { title: 'Write Blog Post', category: 'WORK' },
    { title: 'Yoga Session', category: 'HEALTH' },
];

// Generate data for the last 30 days + next 7 days
export const generateMockData = () => {
    const tasks = [];
    const today = new Date();
    const start = subDays(today, 30);
    const end = subDays(today, -7);

    const days = eachDayOfInterval({ start, end });

    days.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');

        // Add Daily Habits with fixed realistic times
        HABITS.forEach((habit) => {
            const isPast = day < today;
            const completed = isPast ? Math.random() > 0.3 : false;

            let startTime = '08:00';
            let endTime = '08:30';

            // Specific times for specific habits
            if (habit.title.includes('Meditation')) { startTime = '06:30'; endTime = '07:00'; }
            if (habit.title.includes('Exercise')) { startTime = '07:00'; endTime = '08:00'; }
            if (habit.title.includes('Read')) { startTime = '21:00'; endTime = '21:30'; }
            if (habit.title.includes('Dinner')) { startTime = '19:00'; endTime = '20:00'; }

            tasks.push({
                id: crypto.randomUUID(),
                title: habit.title,
                category: CATEGORIES[habit.category],
                date: dayStr,
                startTime,
                endTime,
                completed: completed,
                type: 'habit'
            });
        });

        // Add Random Tasks (2-4 per day) with non-overlapping random hours
        const numTasks = Math.floor(Math.random() * 3) + 2;
        const usedHours = new Set([6, 7, 19, 20, 21]); // Reserve habit hours

        for (let i = 0; i < numTasks; i++) {
            const taskTemplate = TASKS_POOL[Math.floor(Math.random() * TASKS_POOL.length)];
            const isPast = day < today;
            const completed = isPast ? Math.random() > 0.4 : false;

            // Find a free hour
            let startHour = 9;
            for (let attempt = 0; attempt < 10; attempt++) {
                const candidate = Math.floor(Math.random() * 9) + 9; // 9 AM to 5 PM
                if (!usedHours.has(candidate)) {
                    startHour = candidate;
                    usedHours.add(candidate);
                    break;
                }
            }

            const duration = [30, 60, 90][Math.floor(Math.random() * 3)]; // Random duration
            const startTimeStr = `${startHour.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;

            // Calculate end time simpler
            let endH = startHour + Math.floor(duration / 60);
            let endM = duration % 60;
            // Handle edge case if end minutes cause hour rollovers (simple version)
            if (endM >= 60) { endH += 1; endM -= 60; }

            const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            tasks.push({
                id: crypto.randomUUID(),
                title: taskTemplate.title,
                category: CATEGORIES[taskTemplate.category],
                date: dayStr,
                startTime: startTimeStr,
                endTime: endTimeStr,
                completed: completed,
                type: 'task'
            });
        }
    });

    return tasks;
};

export const INITIAL_TASKS = generateMockData();
