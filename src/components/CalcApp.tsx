'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * CALC APP
 * Retro calculator with basic operations.
 */

export default function CalcApp() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const inputDigit = useCallback((digit: string) => {
    getSoundController().playUserKeyClick();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const inputDecimal = useCallback(() => {
    getSoundController().playUserKeyClick();
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const clear = useCallback(() => {
    getSoundController().playAIKeyClick();
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const clearAll = useCallback(() => {
    clear();
    setHistory([]);
  }, [clear]);

  const toggleSign = useCallback(() => {
    getSoundController().playUserKeyClick();
    setDisplay(String(-parseFloat(display)));
  }, [display]);

  const inputPercent = useCallback(() => {
    getSoundController().playUserKeyClick();
    const value = parseFloat(display) / 100;
    setDisplay(String(value));
  }, [display]);

  const performOperation = useCallback((nextOperation: string) => {
    getSoundController().playUserKeyClick();
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = 0;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
      }

      const historyEntry = `${currentValue} ${operation} ${inputValue} = ${result}`;
      setHistory(prev => [historyEntry, ...prev].slice(0, 10));
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);

  const calculate = useCallback(() => {
    if (!operation || previousValue === null) return;

    getSoundController().playStartup();
    const inputValue = parseFloat(display);
    let result = 0;

    switch (operation) {
      case '+':
        result = previousValue + inputValue;
        break;
      case '-':
        result = previousValue - inputValue;
        break;
      case '×':
        result = previousValue * inputValue;
        break;
      case '÷':
        result = inputValue !== 0 ? previousValue / inputValue : 0;
        break;
    }

    const historyEntry = `${previousValue} ${operation} ${inputValue} = ${result}`;
    setHistory(prev => [historyEntry, ...prev].slice(0, 10));
    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [display, previousValue, operation]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+') {
        performOperation('+');
      } else if (e.key === '-') {
        performOperation('-');
      } else if (e.key === '*') {
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        calculate();
      } else if (e.key === 'Escape') {
        clear();
      } else if (e.key === 'Backspace') {
        setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigit, inputDecimal, performOperation, calculate, clear]);

  const Button = ({ value, onClick, wide, color }: { value: string; onClick: () => void; wide?: boolean; color?: string }) => (
    <button
      onClick={onClick}
      style={{
        padding: '12px',
        backgroundColor: '#1a1a1a',
        color: color || 'var(--terminal-green)',
        border: '1px solid var(--terminal-border)',
        cursor: 'pointer',
        fontSize: '18px',
        fontFamily: 'inherit',
        gridColumn: wide ? 'span 2' : 'span 1',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
    >
      {value}
    </button>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      backgroundColor: '#0a0a0a',
      padding: '12px',
      gap: '12px',
    }}>
      {/* CALCULATOR */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* DISPLAY */}
        <div
          className="pixel-border"
          style={{
            padding: '16px',
            backgroundColor: '#000000',
            textAlign: 'right',
          }}
        >
          <div style={{ color: '#666666', fontSize: '12px', marginBottom: '4px' }}>
            {previousValue !== null && operation ? `${previousValue} ${operation}` : '\u00A0'}
          </div>
          <div style={{
            fontSize: '32px',
            color: 'var(--terminal-green)',
            textShadow: '0 0 8px var(--terminal-green)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {display}
          </div>
        </div>

        {/* BUTTONS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          flex: 1,
        }}>
          <Button value="C" onClick={clear} color="var(--terminal-amber)" />
          <Button value="±" onClick={toggleSign} color="#888888" />
          <Button value="%" onClick={inputPercent} color="#888888" />
          <Button value="÷" onClick={() => performOperation('÷')} color="var(--terminal-amber)" />
          
          <Button value="7" onClick={() => inputDigit('7')} />
          <Button value="8" onClick={() => inputDigit('8')} />
          <Button value="9" onClick={() => inputDigit('9')} />
          <Button value="×" onClick={() => performOperation('×')} color="var(--terminal-amber)" />
          
          <Button value="4" onClick={() => inputDigit('4')} />
          <Button value="5" onClick={() => inputDigit('5')} />
          <Button value="6" onClick={() => inputDigit('6')} />
          <Button value="-" onClick={() => performOperation('-')} color="var(--terminal-amber)" />
          
          <Button value="1" onClick={() => inputDigit('1')} />
          <Button value="2" onClick={() => inputDigit('2')} />
          <Button value="3" onClick={() => inputDigit('3')} />
          <Button value="+" onClick={() => performOperation('+')} color="var(--terminal-amber)" />
          
          <Button value="0" onClick={() => inputDigit('0')} wide />
          <Button value="." onClick={inputDecimal} />
          <Button value="=" onClick={calculate} color="var(--terminal-green)" />
        </div>
      </div>

      {/* HISTORY */}
      <div
        className="pixel-border"
        style={{
          width: '140px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d0d0d',
        }}
      >
        <div style={{
          padding: '8px',
          borderBottom: '1px solid var(--terminal-border)',
          color: '#666666',
          fontSize: '10px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>HISTORY</span>
          <button
            onClick={clearAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff3333',
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            CLR
          </button>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          fontSize: '11px',
        }}>
          {history.length === 0 ? (
            <div style={{ color: '#444444' }}>NO HISTORY</div>
          ) : (
            history.map((entry, idx) => (
              <div key={idx} style={{
                color: idx === 0 ? 'var(--terminal-green)' : '#666666',
                marginBottom: '6px',
                paddingBottom: '6px',
                borderBottom: '1px solid #1a1a1a',
              }}>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
