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

export type ViewMode = 'join' | 'audience' | 'screen' | 'admin';
