'use client';

import { useState, useEffect } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * TASK LIST APP
 * Simple to-do list with localStorage persistence.
 */

interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function TaskListApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nikata_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('nikata_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      text: inputValue.trim().toUpperCase(),
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([...tasks, newTask]);
    setInputValue('');
    getSoundController().playUserKeyClick();
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    getSoundController().playAIKeyClick();
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
    getSoundController().playError();
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
    getSoundController().playStartup();
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--terminal-border)',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: 'var(--terminal-green)' }}>TASK MANAGER v1.0</span>
        <span style={{ color: '#666666', fontSize: '12px' }}>
          {pendingCount} PENDING | {completedCount} DONE
        </span>
      </div>

      {/* ADD TASK */}
      <form onSubmit={addTask} style={{
        padding: '12px',
        borderBottom: '1px solid var(--terminal-border)',
        display: 'flex',
        gap: '8px',
      }}>
        <span style={{ color: 'var(--terminal-amber)' }}>NEW&gt;</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="terminal-input"
          placeholder="ENTER TASK..."
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          style={{
            background: 'none',
            border: '1px solid var(--terminal-green)',
            color: 'var(--terminal-green)',
            padding: '2px 12px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          [ADD]
        </button>
      </form>

      {/* TASK LIST */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
      }}>
        {tasks.length === 0 ? (
          <div style={{ color: '#666666', textAlign: 'center', padding: '20px' }}>
            NO TASKS. ADD ONE ABOVE.
          </div>
        ) : (
          tasks.map((task, idx) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid #1a1a1a',
                gap: '8px',
              }}
            >
              <span style={{ color: '#666666', width: '30px' }}>
                {String(idx + 1).padStart(2, '0')}.
              </span>
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  background: 'none',
                  border: `1px solid ${task.completed ? 'var(--terminal-green)' : '#666666'}`,
                  color: task.completed ? 'var(--terminal-green)' : '#666666',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                {task.completed ? '✓' : ' '}
              </button>
              <span style={{
                flex: 1,
                color: task.completed ? '#666666' : 'var(--terminal-green)',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}>
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: 'none',
                  border: '1px solid #ff3333',
                  color: '#ff3333',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                DEL
              </button>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--terminal-border)',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
      }}>
        <span style={{ color: '#666666' }}>{tasks.length} TOTAL TASKS</span>
        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--terminal-amber)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            [CLEAR COMPLETED]
          </button>
        )}
      </div>
    </div>
  );
}
