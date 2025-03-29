import fs from 'fs';
import path from 'path';
import { SaveSystem, SaveFile, SaveMetadata } from './SaveSystem';
import { GameState } from '../models/GameState';
import { PhaseType, PlayerType } from '../models/types';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((dir, file) => `${dir}/${file}`)
}));

describe('SaveSystem', () => {
  let saveSystem: SaveSystem;
  let mockGameState: GameState;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock existsSync to return false (directory doesn't exist)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Create a mock game state
    mockGameState = {
      turn: 3,
      phase: PhaseType.MAIN,
      activePlayer: PlayerType.RUNNER,
      gameOver: false,
      runner: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 2,
        npuTotal: 3
      },
      corp: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 1,
        npuTotal: 2,
        core: {
          maxHp: 10,
          currentHp: 8
        }
      },
      eventLog: []
    };
    
    // Create SaveSystem instance
    saveSystem = new SaveSystem();
  });
  
  test('constructor creates save directory if it does not exist', () => {
    expect(fs.existsSync).toHaveBeenCalledWith('saves');
    expect(fs.mkdirSync).toHaveBeenCalledWith('saves', { recursive: true });
  });
  
  test('constructor does not create directory if it already exists', () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock existsSync to return true (directory exists)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Create new instance
    new SaveSystem();
    
    expect(fs.existsSync).toHaveBeenCalledWith('saves');
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
  
  test('saveGame creates a save file with proper metadata', () => {
    // Mock Date.toISOString
    const mockDate = new Date(2025, 2, 30);
    const mockISOString = '2025-03-30T00:00:00.000Z';
    const mockFilenameTimestamp = '2025-03-30T00-00-00-000Z';
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    jest.spyOn(mockDate, 'toISOString').mockReturnValue(mockISOString);
    
    // Call saveGame
    const filename = saveSystem.saveGame(mockGameState, 'Test Save');
    
    // Verify filename
    expect(filename).toBe(`save_${mockFilenameTimestamp}.json`);
    
    // Verify path.join was called correctly
    expect(path.join).toHaveBeenCalledWith('saves', filename);
    
    // Verify writeFileSync was called with correct parameters
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'saves/save_2025-03-30T00-00-00-000Z.json',
      expect.any(String)
    );
    
    // Verify content of saved file
    const savedContent = JSON.parse((fs.writeFileSync as jest.Mock).mock.calls[0][1]);
    expect(savedContent).toEqual({
      metadata: {
        version: '1.0.0',
        timestamp: mockISOString,
        turnNumber: 3,
        description: 'Test Save'
      },
      gameState: mockGameState
    });
  });
  
  test('loadGame returns a game state from a file', () => {
    // Mock existsSync to return true (file exists)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Create mock save file data
    const mockSaveFile: SaveFile = {
      metadata: {
        version: '1.0.0',
        timestamp: '2025-03-30T00:00:00.000Z',
        turnNumber: 3,
        description: 'Test Save'
      },
      gameState: mockGameState
    };
    
    // Mock readFileSync to return mock save file
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSaveFile));
    
    // Call loadGame
    const loadedGameState = saveSystem.loadGame('test_save.json');
    
    // Verify path.join was called correctly
    expect(path.join).toHaveBeenCalledWith('saves', 'test_save.json');
    
    // Verify readFileSync was called with correct parameters
    expect(fs.readFileSync).toHaveBeenCalledWith('saves/test_save.json', 'utf-8');
    
    // Verify loaded game state
    expect(loadedGameState).toEqual(mockGameState);
  });
  
  test('loadGame throws error if file does not exist', () => {
    // Mock existsSync to return false (file doesn't exist)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Expect loadGame to throw an error
    expect(() => saveSystem.loadGame('nonexistent.json')).toThrow('Save file not found');
  });
  
  test('loadGame throws error if file has invalid version', () => {
    // Mock existsSync to return true (file exists)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Create mock save file data with invalid version
    const mockSaveFile: SaveFile = {
      metadata: {
        version: '0.9.0', // Different version
        timestamp: '2025-03-30T00:00:00.000Z',
        turnNumber: 3,
        description: 'Test Save'
      },
      gameState: mockGameState
    };
    
    // Mock readFileSync to return mock save file
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSaveFile));
    
    // Expect loadGame to throw an error
    expect(() => saveSystem.loadGame('invalid_version.json')).toThrow('Incompatible save file version');
  });
  
  test('loadGame throws error if file is not valid JSON', () => {
    // Mock existsSync to return true (file exists)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock readFileSync to return invalid JSON
    (fs.readFileSync as jest.Mock).mockReturnValue('not valid json');
    
    // Expect loadGame to throw an error
    expect(() => saveSystem.loadGame('invalid_json.json')).toThrow('Failed to parse save file');
  });
  
  test('listSaves returns an array of save files with metadata', () => {
    // Mock readdirSync to return file list
    (fs.readdirSync as jest.Mock).mockReturnValue(['save1.json', 'save2.json', 'notasave.txt']);
    
    // Create mock save file data
    const mockSaveFile1: SaveFile = {
      metadata: {
        version: '1.0.0',
        timestamp: '2025-03-30T00:00:00.000Z',
        turnNumber: 3,
        description: 'Save 1'
      },
      gameState: mockGameState
    };
    
    const mockSaveFile2: SaveFile = {
      metadata: {
        version: '1.0.0',
        timestamp: '2025-03-31T00:00:00.000Z',
        turnNumber: 5,
        description: 'Save 2'
      },
      gameState: mockGameState
    };
    
    // Mock readFileSync to return mock save files
    (fs.readFileSync as jest.Mock)
      .mockReturnValueOnce(JSON.stringify(mockSaveFile1))
      .mockReturnValueOnce(JSON.stringify(mockSaveFile2));
    
    // Call listSaves
    const saveList = saveSystem.listSaves();
    
    // Verify readdirSync was called
    expect(fs.readdirSync).toHaveBeenCalledWith('saves');
    
    // Verify path.join was called for both files
    expect(path.join).toHaveBeenCalledWith('saves', 'save1.json');
    expect(path.join).toHaveBeenCalledWith('saves', 'save2.json');
    
    // Verify readFileSync was called for both files
    expect(fs.readFileSync).toHaveBeenCalledWith('saves/save1.json', 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith('saves/save2.json', 'utf-8');
    
    // Verify returned list (should only include .json files)
    expect(saveList).toHaveLength(2);
    expect(saveList[0]).toEqual({
      filename: 'save1.json',
      metadata: mockSaveFile1.metadata
    });
    expect(saveList[1]).toEqual({
      filename: 'save2.json',
      metadata: mockSaveFile2.metadata
    });
  });
  
  test('listSaves handles corrupted save files gracefully', () => {
    // Mock readdirSync to return file list
    (fs.readdirSync as jest.Mock).mockReturnValue(['valid.json', 'corrupted.json']);
    
    // Create mock save file data
    const mockSaveFile: SaveFile = {
      metadata: {
        version: '1.0.0',
        timestamp: '2025-03-30T00:00:00.000Z',
        turnNumber: 3,
        description: 'Valid Save'
      },
      gameState: mockGameState
    };
    
    // Mock readFileSync to return valid JSON for the first file and corrupt data for the second
    (fs.readFileSync as jest.Mock)
      .mockReturnValueOnce(JSON.stringify(mockSaveFile))
      .mockReturnValueOnce('corrupted data');
    
    // Call listSaves
    const saveList = saveSystem.listSaves();
    
    // Verify returned list
    expect(saveList).toHaveLength(2);
    expect(saveList[0]).toEqual({
      filename: 'valid.json',
      metadata: mockSaveFile.metadata
    });
    expect(saveList[1]).toEqual({
      filename: 'corrupted.json',
      metadata: {
        version: 'unknown',
        timestamp: 'unknown',
        turnNumber: -1,
        description: 'Corrupted save file'
      }
    });
  });
  
  test('deleteSave deletes a save file', () => {
    // Mock existsSync to return true (file exists)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Call deleteSave
    const result = saveSystem.deleteSave('test_save.json');
    
    // Verify path.join was called correctly
    expect(path.join).toHaveBeenCalledWith('saves', 'test_save.json');
    
    // Verify unlinkSync was called with correct parameters
    expect(fs.unlinkSync).toHaveBeenCalledWith('saves/test_save.json');
    
    // Verify result
    expect(result).toBe(true);
  });
  
  test('deleteSave returns false if file does not exist', () => {
    // Mock existsSync to return false (file doesn't exist)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Call deleteSave
    const result = saveSystem.deleteSave('nonexistent.json');
    
    // Verify path.join was called correctly
    expect(path.join).toHaveBeenCalledWith('saves', 'nonexistent.json');
    
    // Verify unlinkSync was not called
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    
    // Verify result
    expect(result).toBe(false);
  });
  
  test('createAutosave creates a save with turn-based description', () => {
    // Spy on saveGame
    const saveGameSpy = jest.spyOn(saveSystem, 'saveGame');
    
    // Call createAutosave
    saveSystem.createAutosave(mockGameState);
    
    // Verify saveGame was called with correct parameters
    expect(saveGameSpy).toHaveBeenCalledWith(mockGameState, 'Autosave - Turn 3');
  });
}); 