export interface Question {
  id: string;
  roomId: string;
  author: string;
  content: string;
  votes: number;
  voters: string[];
  isAnswered: boolean;
  isHighlighted: boolean;
  isHidden: boolean;
  createdAt: number;
}

export interface RoomInfo {
  id: string;
  title: string;
  isLocked: boolean;
  questions: Question[];
  userCount: number;
}

export interface RoomHistoryItem {
  id: string;
  title: string;
  createdAt: number;
  questionCount: number;
  totalVotes: number;
  answeredCount: number;
  isLocked: boolean;
}

export type ViewMode = 'join' | 'audience' | 'screen' | 'admin' | 'history';
