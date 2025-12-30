import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Trash2, Plus, Tag } from 'lucide-react';

const Settings = () => {
    const { tags, addTag, deleteTag } = useTasks();
    const [newTag, setNewTag] = useState({ label: '', color: '#3b82f6' });

    const handleAddTag = (e) => {
        e.preventDefault();
        if (!newTag.label) return;

        addTag({
            id: newTag.label.toLowerCase().replace(/\s+/g, '-'),
            label: newTag.label,
            color: newTag.color
        });
        setNewTag({ label: '', color: '#3b82f6' });
    };

    // const COLORS = [
    //     '#ef4444', // Red
    //     '#f97316', // Orange
    //     '#f59e0b', // Amber
    //     '#10b981', // Emerald
    //     '#06b6d4', // Cyan
    //     '#3b82f6', // Blue
    //     '#6366f1', // Indigo
    //     '#8b5cf6', // Violet
    //     '#ec4899', // Pink
    //     '#64748b', // Slate
    //     '#f59e0b', // Amber

    // ];
    const COLORS = [
        '#ef4444', // Red
        '#f97316', // Orange
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#028298ff', // Cyan
        '#3b82f6', // Blue
        '#0a0dd3ff', // Indigo
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#64748b', // Slate
        '#a7607cff', // Amber (duplicate)
        '#14b8a6', // Teal
        '#84cc16', // Lime
        '#eab308', // Yellow
        '#3f205bff', // Purple
        '#f43f5e', // Rose
        '#0ea5e9', // Sky
        '#004b1bff', // Green
        '#fb923c', // Orange (lighter)
        '#d946ef', // Fuchsia
        '#71717a', // Gray
    ];

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Settings</h1>
                    <p className="text-muted">Manage your preferences and categories</p>
                </div>
            </header>

            <div className="glass-panel" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '1rem' }}>
                    <Tag size={24} className="text-primary" style={{ color: 'var(--primary)' }} />
                    <h2 className="text-xl font-bold">Categories & Tags</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Existing Tags List */}
                    <div>
                        <h3 className="text-sm font-bold text-muted uppercase mb-4">Existing Tags</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {tags.map(tag => (
                                <div key={tag.id} className="glass-panel" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: tag.color }}></div>
                                        <span className="font-medium">{tag.label}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteTag(tag.id)}
                                        className="text-muted hover:text-danger"
                                        style={{ transition: 'color 0.2s', color: 'var(--text-muted)' }}
                                        onMouseEnter={(e) => e.target.style.color = 'var(--danger)'}
                                        onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New Tag */}
                    <div>
                        <h3 className="text-sm font-bold text-muted uppercase mb-4">Add New Tag</h3>
                        <form onSubmit={handleAddTag} className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-primary)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="text-sm text-muted mb-2 block">Label Name</label>
                                <input
                                    type="text"
                                    value={newTag.label}
                                    onChange={(e) => setNewTag({ ...newTag, label: e.target.value })}
                                    className="input-reset"
                                    placeholder="e.g. Fitness"
                                    style={{
                                        border: '1px solid var(--bg-tertiary)',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-sm text-muted mb-2 block">Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewTag({ ...newTag, color })}
                                            style={{
                                                width: '2rem',
                                                height: '2rem',
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                border: newTag.color === color ? '2px solid white' : '2px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: '600',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Plus size={20} />
                                Create Tag
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
