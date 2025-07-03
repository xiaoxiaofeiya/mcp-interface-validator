/**
 * Mock implementation of VS Code API for testing
 */

export class Position {
  line: number;
  character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }
}

export class Selection {
  anchor: Position;
  active: Position;

  constructor(anchor: Position, active: Position) {
    this.anchor = anchor;
    this.active = active;
  }
}

export class Uri {
  static parse(value: string): Uri {
    return new Uri(value);
  }

  constructor(public fsPath: string) {}

  toString(): string {
    return this.fsPath;
  }
}

export const workspace = {
  onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn()
  }))
};

export const window = {
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
  activeTextEditor: undefined,
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn()
  }))
};

export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn()
};

export const languages = {
  registerDocumentFormattingEditProvider: jest.fn(() => ({ dispose: jest.fn() })),
  registerHoverProvider: jest.fn(() => ({ dispose: jest.fn() }))
};

export const extensions = {
  getExtension: jest.fn()
};

// Mock disposable
export interface Disposable {
  dispose(): void;
}

// Mock text document
export interface TextDocument {
  uri: Uri;
  fileName: string;
  languageId: string;
  version: number;
  isDirty: boolean;
  isClosed: boolean;
  getText(): string;
  lineAt(line: number): any;
}

// Mock text editor
export interface TextEditor {
  document: TextDocument;
  selection: Selection;
  edit(callback: (editBuilder: any) => void): Promise<boolean>;
}

// Mock edit builder
export class TextEditorEdit {
  insert(location: Position, value: string): void {}
  replace(location: Selection | Position, value: string): void {}
  delete(location: Selection): void {}
}

export default {
  Position,
  Selection,
  Uri,
  workspace,
  window,
  commands,
  languages,
  extensions,
  TextEditorEdit
};
