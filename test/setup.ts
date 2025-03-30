import 'jest-extended';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Setup enzyme
configure({ adapter: new Adapter() });

// Modern global augmentation without namespace
declare global {
  function mockConsole(): void;
}

// Implement the global helper
global.mockConsole = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}; 