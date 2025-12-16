import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
};

type GameState = 'menu' | 'playing' | 'gameover' | 'victory';

// --- Data: 30 Cartoon Questions ---
const QUESTIONS_DB: Question[] = [
  { id: 1, question: "Как звали кота в Простоквашино?", options: ["Мурзик", "Леопольд", "Матроскин", "Том"], correctAnswer: "Матроскин" },
  { id: 2, question: "Кто живет в ананасе на дне океана?", options: ["Патрик", "Спанч Боб", "Сквидвард", "Планктон"], correctAnswer: "Спанч Боб" },
  { id: 3, question: "Лучший друг Чебурашки?", options: ["Шапокляк", "Гена", "Пятачок", "Карлсон"], correctAnswer: "Гена" },
  { id: 4, question: "Что Винни-Пух любил больше всего?", options: ["Варенье", "Мёд", "Сгущенку", "Пончики"], correctAnswer: "Мёд" },
  { id: 5, question: "Какого цвета Шрек?", options: ["Синий", "Красный", "Зеленый", "Желтый"], correctAnswer: "Зеленый" },
  { id: 6, question: "Как зовут львенка из 'Король Лев'?", options: ["Муфаса", "Шрам", "Тимон", "Симба"], correctAnswer: "Симба" },
  { id: 7, question: "Кто говорит фразу 'Ну, заяц, погоди!'?", options: ["Лиса", "Медведь", "Волк", "Кабан"], correctAnswer: "Волк" },
  { id: 8, question: "Как звали мамонта в 'Ледниковом периоде'?", options: ["Мэнни", "Сид", "Диего", "Скрэт"], correctAnswer: "Мэнни" },
  { id: 9, question: "Кто такая Рапунцель?", options: ["Русалочка", "Принцесса с длинными волосами", "Фея", "Золушка"], correctAnswer: "Принцесса с длинными волосами" },
  { id: 10, question: "В кого превращалась Фиона ночью?", options: ["В дракона", "В лягушку", "В огра", "В великана"], correctAnswer: "В огра" },
  { id: 11, question: "Какой зверь Кунг-Фу Панда?", options: ["Тигр", "Панда", "Обезьяна", "Богомол"], correctAnswer: "Панда" },
  { id: 12, question: "Как зовут снеговика из 'Холодного сердца'?", options: ["Свен", "Кристоф", "Олаф", "Ганс"], correctAnswer: "Олаф" },
  { id: 13, question: "Поэт из Смешариков?", options: ["Крош", "Ёжик", "Бараш", "Лосяш"], correctAnswer: "Бараш" },
  { id: 14, question: "Кто потерял хрустальную туфельку?", options: ["Белоснежка", "Золушка", "Спящая красавица", "Ариэль"], correctAnswer: "Золушка" },
  { id: 15, question: "Друг Молнии Маккуина?", options: ["Мэтр", "Док", "Салли", "Гвидо"], correctAnswer: "Мэтр" },
  { id: 16, question: "Кто живет на крыше?", options: ["Винни-Пух", "Карлсон", "Незнайка", "Буратино"], correctAnswer: "Карлсон" },
  { id: 17, question: "Что потерял ослик Иа?", options: ["Голос", "Хвост", "Уши", "Дом"], correctAnswer: "Хвост" },
  { id: 18, question: "Как зовут рыбку-клоуна, ищущего сына?", options: ["Дори", "Немо", "Марлин", "Брюс"], correctAnswer: "Марлин" },
  { id: 19, question: "Главный враг Черепашек-ниндзя?", options: ["Крэнг", "Шреддер", "Бибоп", "Рокстеди"], correctAnswer: "Шреддер" },
  { id: 20, question: "Что ест Попай для силы?", options: ["Мясо", "Шпинат", "Кашу", "Яблоки"], correctAnswer: "Шпинат" },
  { id: 21, question: "Как зовут девочку, которая дружит с Медведем?", options: ["Даша", "Маша", "Катя", "Алиса"], correctAnswer: "Маша" },
  { id: 22, question: "Кто украл Луну в 'Гадкий Я'?", options: ["Вектор", "Грю", "Миньоны", "Доктор Нефарио"], correctAnswer: "Грю" },
  { id: 23, question: "Какого цвета маска у Леонардо (Черепашки-ниндзя)?", options: ["Красная", "Синяя", "Оранжевая", "Фиолетовая"], correctAnswer: "Синяя" },
  { id: 24, question: "Как зовут крысу из 'Рататуй'?", options: ["Эмиль", "Джанго", "Реми", "Стюарт"], correctAnswer: "Реми" },
  { id: 25, question: "Кто самый умный в Смешариках?", options: ["Копатыч", "Пин", "Лосяш", "Совунья"], correctAnswer: "Лосяш" },
  { id: 26, question: "На чем летал Алладин?", options: ["На метле", "На ковре-самолете", "На драконе", "На орле"], correctAnswer: "На ковре-самолете" },
  { id: 27, question: "У кого нос рос, когда он врал?", options: ["Чиполлино", "Незнайка", "Буратино", "Пьеро"], correctAnswer: "Буратино" },
  { id: 28, question: "Как зовут зебру из Мадагаскара?", options: ["Алекс", "Мелман", "Марти", "Глория"], correctAnswer: "Марти" },
  { id: 29, question: "Кто сказал 'Ребята, давайте жить дружно'?", options: ["Кот Матроскин", "Кот Леопольд", "Котенок Гав", "Кот в сапогах"], correctAnswer: "Кот Леопольд" },
  { id: 30, question: "Кто такая Пеппа?", options: ["Кошка", "Собака", "Свинка", "Овечка"], correctAnswer: "Свинка" },
];

const App = () => {
    const [gameState, setGameState] = useState<GameState>('menu');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [stars, setStars] = useState(0);
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
    // Logic to calculate max lives based on progress
    const getMaxLives = (currentScore: number) => {
      if (currentScore >= 6) return 1; // Level 3+
      if (currentScore >= 3) return 2; // Level 2
      return 3; // Level 1
    };
  
    const startGame = () => {
      setAvailableQuestions([...QUESTIONS_DB]);
      setScore(0);
      setLives(3);
      setStars(0);
      setFeedback('none');
      setSelectedAnswer(null);
      setGameState('playing');
    };
  
    const nextQuestion = (currentPool: Question[], currentScore: number) => {
      if (currentPool.length === 0) {
        setGameState('victory');
        return;
      }
  
      const randomIndex = Math.floor(Math.random() * currentPool.length);
      const question = currentPool[randomIndex];
      
      const newPool = currentPool.filter((_, index) => index !== randomIndex);
      setAvailableQuestions(newPool);
      setCurrentQuestion(question);
      setFeedback('none');
      setSelectedAnswer(null);
    };
  
    useEffect(() => {
      if (gameState === 'playing' && !currentQuestion) {
        nextQuestion([...QUESTIONS_DB], 0);
      }
    }, [gameState]);
  
    const handleAnswer = (option: string) => {
      if (feedback !== 'none' || !currentQuestion) return;
  
      if (option === currentQuestion.correctAnswer) {
        setFeedback('correct');
        const newScore = score + 1;
        setScore(newScore);
  
        const newStars = Math.floor(newScore / 3);
        
        let nextLives = lives;
        // Check if we hit a milestone (3, 6, 9...)
        if (newScore % 3 === 0) {
            const maxAllowed = getMaxLives(newScore);
            // "с каждым уровнем жизнь уменьшается" -> Cap the lives
            if (nextLives > maxAllowed) {
              nextLives = maxAllowed;
            }
        }
        
        setStars(newStars);
        setLives(nextLives);
  
        setTimeout(() => {
          nextQuestion(availableQuestions, newScore);
        }, 1200);
      } else {
        setFeedback('wrong');
        const newLives = lives - 1;
        setLives(newLives);
  
        if (newLives <= 0) {
          setTimeout(() => setGameState('gameover'), 1200);
        } else {
          setTimeout(() => {
            nextQuestion(availableQuestions, score);
          }, 1200);
        }
      }
    };
  
    const getDifficultyText = () => {
      if (score >= 6) return "Уровень: Хардкор (1 жизнь)";
      if (score >= 3) return "Уровень: Средний (2 жизни)";
      return "Уровень: Легкий";
    };
  
    if (gameState === 'menu') {
      return (
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-pop">
          <h1 className="text-4xl font-black text-purple-600 mb-2">Мульти-Квиз</h1>
          <p className="text-gray-500 mb-8">Проверь свои знания мультиков!</p>
          
          <div className="space-y-4 mb-8 text-left bg-purple-50 p-4 rounded-xl shadow-inner">
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><i className="fas fa-star text-yellow-400 text-xl"></i></div>
               <span className="text-sm text-gray-700 font-bold">3 вопроса = 1 звезда</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><i className="fas fa-arrow-down text-red-400 text-xl"></i></div>
               <span className="text-sm text-gray-700 font-bold">Сложность растет!</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-8 flex justify-center"><i className="fas fa-heart-crack text-gray-500 text-xl"></i></div>
               <span className="text-sm text-gray-700 font-bold">На Хардкоре всего 1 жизнь!</span>
            </div>
          </div>
  
          <button 
            onClick={startGame}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl text-xl hover:scale-105 transition-transform shadow-lg active:scale-95"
          >
            Начать игру
          </button>
        </div>
      );
    }
  
    if (gameState === 'gameover') {
      return (
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-pop">
          <div className="mb-6 text-6xl animate-bounce">😭</div>
          <h2 className="text-3xl font-black text-red-500 mb-2">Игра окончена</h2>
          <p className="text-xl text-gray-700 mb-6">Жизни закончились!</p>
          <div className="bg-gray-100 rounded-xl p-4 mb-8">
            <p className="text-gray-500 text-sm uppercase font-bold tracking-wider">Ваш результат</p>
            <p className="text-5xl font-black text-purple-600 my-2">{score}</p>
            <div className="flex justify-center gap-1 mt-2">
               {[...Array(stars)].map((_, i) => (
                  <i key={i} className="fas fa-star text-yellow-400 text-xl"></i>
               ))}
               {stars === 0 && <span className="text-gray-300 text-xs">Нет звезд</span>}
            </div>
          </div>
          <button 
            onClick={startGame}
            className="w-full bg-gray-800 text-white font-bold py-3 px-6 rounded-2xl hover:bg-gray-700 transition-colors shadow-lg"
          >
            Попробовать снова
          </button>
        </div>
      );
    }
  
    if (gameState === 'victory') {
      return (
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-pop">
          <div className="mb-6 text-6xl animate-bounce">🏆</div>
          <h2 className="text-3xl font-black text-green-500 mb-2">Ты Герой!</h2>
          <p className="text-gray-600 mb-6">Все вопросы пройдены!</p>
          <p className="text-6xl font-black text-purple-600 mb-8">{score}</p>
          <button 
            onClick={startGame}
            className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-2xl hover:bg-green-600 transition-colors shadow-lg"
          >
            Сыграть еще раз
          </button>
        </div>
      );
    }
  
    return (
      <div className="w-full max-w-lg px-4">
        {/* HUD */}
        <div className="flex justify-between items-center mb-6 bg-white/20 backdrop-blur-lg p-4 rounded-2xl text-white shadow-lg border border-white/30">
          <div className="flex flex-col">
             <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Жизни</div>
             <div className="flex gap-1 h-6">
               {[...Array(Math.max(lives, 0))].map((_, i) => (
                 <i key={i} className="fas fa-heart text-red-500 text-xl drop-shadow-sm"></i>
               ))}
               {/* Show empty hearts for max capacity allowed at current level */}
               {[...Array(Math.max(getMaxLives(score) - lives, 0))].map((_, i) => (
                 <i key={`lost-${i}`} className="fas fa-heart text-black/20 text-xl"></i>
               ))}
             </div>
          </div>
          
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
               <span className="font-black text-3xl drop-shadow-md">{score}</span>
               <i className="fas fa-trophy text-yellow-300 text-xl drop-shadow-md"></i>
             </div>
             <div className="flex gap-1 h-4">
               {[...Array(stars)].map((_, i) => (
                 <i key={i} className="fas fa-star text-yellow-300 text-sm drop-shadow-sm"></i>
               ))}
             </div>
          </div>
        </div>
        
        {/* Difficulty Banner */}
        <div className="text-center mb-6 transform transition-all duration-500">
           <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md shadow-lg border border-white/10`}>
              {score >= 6 && <i className="fas fa-fire text-orange-500 animate-pulse"></i>}
              {getDifficultyText()}
              {score >= 6 && <i className="fas fa-fire text-orange-500 animate-pulse"></i>}
           </div>
        </div>
  
        {/* Question Card */}
        <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[420px] flex flex-col transition-all duration-300 ${feedback === 'wrong' ? 'shake ring-4 ring-red-400' : ''} ${feedback === 'correct' ? 'ring-4 ring-green-400 transform scale-[1.02]' : ''}`}>
          <div className="bg-purple-50 p-8 flex-grow flex items-center justify-center text-center relative overflow-hidden">
            {/* Background pattern decorative */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <i className="fas fa-question absolute top-4 left-4 text-4xl"></i>
                <i className="fas fa-star absolute bottom-4 right-4 text-6xl"></i>
                <i className="fas fa-tv absolute top-10 right-10 text-3xl"></i>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-purple-900 leading-tight relative z-10">
              {currentQuestion?.question}
            </h2>
          </div>
  
          <div className="p-6 grid grid-cols-1 gap-3 bg-white">
            {currentQuestion?.options.map((option, index) => {
               let btnClass = "py-4 px-6 rounded-xl font-bold text-lg transition-all transform active:scale-95 shadow-sm border-b-4 ";
               
               if (feedback === 'none') {
                 btnClass += "bg-white border-purple-100 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md";
               } else {
                 if (option === currentQuestion.correctAnswer) {
                   btnClass += "bg-green-500 border-green-700 text-white shadow-green-200";
                 } else if (option === selectedAnswer) {
                   btnClass += "bg-red-500 border-red-700 text-white shadow-red-200";
                 } else {
                   btnClass += "bg-gray-50 border-gray-200 text-gray-300 opacity-50 cursor-not-allowed";
                 }
               }
  
               return (
                <button
                  key={index}
                  onClick={() => {
                     setSelectedAnswer(option);
                     handleAnswer(option);
                  }}
                  disabled={feedback !== 'none'}
                  className={btnClass}
                >
                  {option}
                </button>
               );
            })}
          </div>
        </div>
        
        <div className="text-center mt-6 text-white/60 text-sm font-semibold">
           Вопросов осталось: {availableQuestions.length}
        </div>
      </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);