/**
 * SaveSystem class for saving and loading game state
 * Handles serialization, deserialization, and file I/O
 */

import fs from 'fs';
import path from 'path';
import { GameState } from '../models/GameState';

/**
 * Interface for save file metadata
 */
export interface SaveMetadata {
  version: string;
  timestamp: string;
  turnNumber: number;
  description: string;
}

/**
 * Interface for save file content
 */
export interface SaveFile {
  metadata: SaveMetadata;
  gameState: GameState;
}

/**
 * SaveSystem class for managing game saves
 */
export class SaveSystem {
  private readonly VERSION = '1.0.0';
  private readonly SAVE_DIR = 'saves';
  
  /**
   * Initialize the save system
   * Creates save directory if it doesn't exist
   */
  constructor() {
    // Create save directory if it doesn't exist
    if (!fs.existsSync(this.SAVE_DIR)) {
      fs.mkdirSync(this.SAVE_DIR, { recursive: true });
    }
  }
  
  /**
   * Save the current game state to a file
   * @param gameState The current game state
   * @param description Optional description for the save
   * @returns The filename of the saved game
   */
  public saveGame(gameState: GameState, description = 'Autosave'): string {
    // Create metadata
    const metadata: SaveMetadata = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      turnNumber: gameState.turn,
      description
    };
    
    // Create save file content
    const saveFile: SaveFile = {
      metadata,
      gameState
    };
    
    // Create filename based on timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `save_${timestamp}.json`;
    const filepath = path.join(this.SAVE_DIR, filename);
    
    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(saveFile, null, 2));
    
    return filename;
  }
  
  /**
   * Load a game state from a file
   * @param filename The filename to load
   * @returns The loaded game state
   * @throws Error if file doesn't exist or is invalid
   */
  public loadGame(filename: string): GameState {
    // Construct filepath
    const filepath = path.join(this.SAVE_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      throw new Error(`Save file not found: ${filename}`);
    }
    
    // Read file
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    
    try {
      // Parse JSON
      const saveFile = JSON.parse(fileContent) as SaveFile;
      
      // Validate version
      if (!saveFile.metadata || saveFile.metadata.version !== this.VERSION) {
        throw new Error(`Incompatible save file version: ${saveFile.metadata?.version || 'unknown'}`);
      }
      
      // Return game state
      return saveFile.gameState;
    } catch (error) {
      throw new Error(`Failed to parse save file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List all available save files
   * @returns Array of save files with metadata
   */
  public listSaves(): { filename: string; metadata: SaveMetadata }[] {
    // Get all files in save directory
    const files = fs.readdirSync(this.SAVE_DIR)
      .filter(file => file.endsWith('.json'));
    
    // Extract metadata from each file
    return files.map(filename => {
      try {
        const filepath = path.join(this.SAVE_DIR, filename);
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const saveFile = JSON.parse(fileContent) as SaveFile;
        
        return {
          filename,
          metadata: saveFile.metadata
        };
      } catch (error) {
        // Return placeholder metadata for corrupted files
        return {
          filename,
          metadata: {
            version: 'unknown',
            timestamp: 'unknown',
            turnNumber: -1,
            description: 'Corrupted save file'
          }
        };
      }
    });
  }
  
  /**
   * Delete a save file
   * @param filename The filename to delete
   * @returns True if file was deleted, false otherwise
   */
  public deleteSave(filename: string): boolean {
    // Construct filepath
    const filepath = path.join(this.SAVE_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return false;
    }
    
    // Delete file
    fs.unlinkSync(filepath);
    return true;
  }
  
  /**
   * Create an autosave of the current game
   * @param gameState The current game state
   * @returns The filename of the autosave
   */
  public createAutosave(gameState: GameState): string {
    return this.saveGame(gameState, `Autosave - Turn ${gameState.turn}`);
  }
} 