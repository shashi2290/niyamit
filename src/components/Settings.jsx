import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Trash2, Plus, Tag, Edit2, X, Check } from 'lucide-react';

const Settings = () => {
    const { tags, addTag, updateTag, deleteTag } = useTasks();
    const [tagForm, setTagForm] = useState({ label: '', color: '#3b82f6' });
    const [editingTagId, setEditingTagId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tagForm.label) return;

        if (editingTagId) {
             await updateTag({
                id: editingTagId,
                label: tagForm.label,
                color: tagForm.color
            });
            setEditingTagId(null);
        } else {
            await addTag({
                id: tagForm.label.toLowerCase().replace(/\s+/g, '-'),
                label: tagForm.label,
                color: tagForm.color
            });
        }
        setTagForm({ label: '', color: '#3b82f6' });
    };

    const handleEditClick = (tag) => {
        setTagForm({ label: tag.label, color: tag.color });
        setEditingTagId(tag.id);
    };

    const handleCancelEdit = () => {
        setTagForm({ label: '', color: '#3b82f6' });
        setEditingTagId(null);
    };

    const COLORS = [
        '#ef4444', // Red
        '#f97316', // Orange
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#64748b', // Slate
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
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEditClick(tag)}
                                            className="text-muted hover:text-primary"
                                            style={{ transition: 'color 0.2s', color: 'var(--text-muted)' }}
                                            onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                                        >
                                            <Edit2 size={18} />
                                        </button>
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
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add/Edit Tag Form */}
                    <div>
                        <h3 className="text-sm font-bold text-muted uppercase mb-4">
                            {editingTagId ? 'Edit Tag' : 'Add New Tag'}
                        </h3>
                        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-primary)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="text-sm text-muted mb-2 block">Label Name</label>
                                <input
                                    type="text"
                                    value={tagForm.label}
                                    onChange={(e) => setTagForm({ ...tagForm, label: e.target.value })}
                                    className="input-reset"
                                    placeholder="e.g. Fitness"
                                    style={{
                                        border: '1px solid var(--bg-tertiary)',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        width: '100%'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-sm text-muted mb-2 block">Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setTagForm({ ...tagForm, color })}
                                            style={{
                                                width: '2rem',
                                                height: '2rem',
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                border: tagForm.color === color ? '2px solid white' : '2px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    ))}
                                    {/* Custom Color Picker */}
                                    <div style={{ position: 'relative', width: '2rem', height: '2rem' }}>
                                        <input
                                            type="color"
                                            value={tagForm.color}
                                            onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                                            style={{
                                                position: 'absolute',
                                                opacity: 0,
                                                width: '100%',
                                                height: '100%',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                                            border: !COLORS.includes(tagForm.color) ? '2px solid white' : '2px solid transparent',
                                            boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.1)'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingTagId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        style={{
                                            padding: '0.75rem',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontWeight: '600',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            flex: 1
                                        }}
                                    >
                                        <X size={20} />
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: '600',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flex: 2
                                    }}
                                >
                                    {editingTagId ? <Check size={20} /> : <Plus size={20} />}
                                    {editingTagId ? 'Update Tag' : 'Create Tag'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
