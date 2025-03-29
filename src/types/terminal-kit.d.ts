/**
 * TypeScript declaration file for terminal-kit
 */

declare module 'terminal-kit' {
  export interface Terminal {
    // Basic terminal operations
    clear: () => void;
    moveTo: (x: number, y: number) => void;
    
    // Colors and styling
    bgBlack: () => void;
    green: () => void;
    
    // Text output
    (text: string): void;
    
    // Terminal info
    width: number;
    height: number;
    
    // Event handling
    once: (event: string, callback: (key: string) => void) => void;
    on: (event: string, callback: (key: string) => void) => void;
    
    // Additional methods
    grabInput: (options?: boolean | { mouse?: string }) => void;
    hideCursor: () => void;
    showCursor: () => void;
    bold: () => void;
    reset: () => void;
  }
  
  export const terminal: Terminal;
} 