
export interface GameRecord {
  id?: string;
  player_name: string;
  attempts: number;
  duration_seconds: number;
  created_at?: string;
}

export interface GuessHistory {
  value: number;
  result: 'High' | 'Low' | 'Correct';
  timestamp: Date;
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}
