
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameRecord, GuessHistory } from './types';
import { getBestRecord, saveRecord } from './supabaseService';
import { Trophy, Timer, RotateCcw, Send, Play, User, History as HistoryIcon } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [bestRecord, setBestRecord] = useState<GameRecord | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [history, setHistory] = useState<GuessHistory[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);

  // Initialize Best Record
  useEffect(() => {
    refreshBestRecord();
  }, []);

  const refreshBestRecord = async () => {
    const record = await getBestRecord();
    setBestRecord(record);
  };

  // Timer logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      timerRef.current = window.setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, startTime]);

  const startGame = () => {
    if (!playerName.trim()) {
      alert("도전자 이름을 입력해주세요!");
      return;
    }
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setGameState(GameState.PLAYING);
    setHistory([]);
    setStartTime(Date.now());
    setElapsedTime(0);
    setFeedback(null);
    setCurrentGuess('');
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(currentGuess);
    if (isNaN(num) || num < 1 || num > 100) {
      alert("1에서 100 사이의 숫자를 입력하세요.");
      return;
    }

    let result: 'High' | 'Low' | 'Correct' = 'Correct';
    if (num > targetNumber) result = 'High';
    else if (num < targetNumber) result = 'Low';

    const newGuess: GuessHistory = {
      value: num,
      result,
      timestamp: new Date()
    };

    setHistory(prev => [newGuess, ...prev]);
    setCurrentGuess('');

    if (result === 'Correct') {
      finishGame(history.length + 1);
    } else {
      setFeedback(result === 'High' ? "더 낮게!" : "더 높게!");
    }
  };

  const finishGame = async (attempts: number) => {
    setGameState(GameState.FINISHED);
    const duration = Math.floor((Date.now() - (startTime || 0)) / 1000);
    
    const newRecord: GameRecord = {
      player_name: playerName,
      attempts,
      duration_seconds: duration
    };

    await saveRecord(newRecord);
    await refreshBestRecord();
  };

  const resetGame = () => {
    setGameState(GameState.IDLE);
    setPlayerName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header Section */}
        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-300" />
            숫자 맞추기 챌린지
          </h1>
          <p className="text-indigo-100 opacity-90">1부터 100 사이의 숨겨진 숫자를 찾아보세요!</p>
          
          {/* Hall of Fame */}
          <div className="mt-6 bg-indigo-700/50 rounded-2xl p-4 backdrop-blur-sm border border-indigo-400/30">
            <div className="text-xs uppercase tracking-wider font-semibold text-indigo-200 mb-2">최고 기록</div>
            {bestRecord ? (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold">{bestRecord.player_name}</span>
                  <span className="text-indigo-200 text-sm ml-2">님</span>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1">
                    <HistoryIcon className="w-4 h-4 text-indigo-300" />
                    {bestRecord.attempts}회
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4 text-indigo-300" />
                    {bestRecord.duration_seconds}초
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-indigo-200 italic text-sm">첫 번째 기록을 세워보세요!</p>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          
          {gameState === GameState.IDLE && (
            <div className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">도전자 이름</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-lg"
                  />
                </div>
              </div>
              <button
                onClick={startGame}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg"
              >
                <Play className="fill-current" />
                게임 시작하기
              </button>
            </div>
          )}

          {gameState === GameState.PLAYING && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Timer className="text-indigo-600" />
                  <span className="text-2xl font-mono font-bold">{elapsedTime}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <HistoryIcon className="text-indigo-600" />
                  <span className="text-2xl font-mono font-bold">{history.length}</span>
                </div>
              </div>

              <form onSubmit={handleGuess} className="flex gap-2">
                <input
                  type="number"
                  value={currentGuess}
                  autoFocus
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  placeholder="???"
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-2xl font-bold text-center"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  <Send className="w-8 h-8" />
                </button>
              </form>

              {feedback && (
                <div className={`text-center py-4 rounded-2xl font-bold text-xl animate-bounce ${feedback === '더 높게!' ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                  {feedback}
                </div>
              )}

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">최근 입력한 숫자</h3>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {history.length > 0 ? (
                    history.map((h, i) => (
                      <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${i === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 opacity-60'}`}>
                        <span className="text-lg font-bold">#{history.length - i} : {h.value}</span>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${h.result === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {h.result === 'High' ? 'Too High' : 'Too Low'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-300 italic">숫자를 입력하여 시작하세요</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {gameState === GameState.FINISHED && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                <div className="relative bg-white p-8 rounded-full border-4 border-yellow-400 shadow-2xl">
                  <Trophy className="w-20 h-20 text-yellow-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-800">정답입니다!</h2>
                <p className="text-slate-500 text-lg">{playerName}님, 대단한 실력이에요!</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl">
                  <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">시도 횟수</div>
                  <div className="text-3xl font-black text-indigo-600">{history.length}회</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl">
                  <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">소요 시간</div>
                  <div className="text-3xl font-black text-indigo-600">{elapsedTime}초</div>
                </div>
              </div>

              <button
                onClick={resetGame}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-lg"
              >
                <RotateCcw className="w-5 h-5" />
                다시 도전하기
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Instructions */}
      <p className="mt-8 text-slate-400 text-sm max-w-xs text-center">
        컴퓨터가 생각한 1부터 100 사이의 숫자를 최대한 빠르게, 그리고 최소한의 시도로 맞혀보세요.
      </p>
    </div>
  );
};

export default App;
