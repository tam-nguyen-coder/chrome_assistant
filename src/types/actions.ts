export interface AIAction {
  id: string;
  label: string;
  prompt: string;
  emoji?: string;
  isFixed?: boolean;
}

export interface ContextActionMessage {
  type: 'CONTEXT_ACTION';
  prompt: string;
  action: string;
  selectedText: string;
}

export interface PopupActionMessage {
  type: 'POPUP_ACTION';
  prompt: string;
  action: string;
  selectedText: string;
}

export interface PendingActionMessage extends ContextActionMessage {
  timestamp: number;
}