import React, { useState, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import { CARTOONS, TRANSLATIONS } from './data';
import { Cartoon, GameState, Language, PlayerStats } from './types';
import { Play, Home, RefreshCw, ShoppingCart, Heart, Star, Settings, Pause, Clapperboard, Award, Shield, Zap, Tv, Film, Trophy, CheckCircle2, Info, Camera, Palette } from 'lucide-react';

// --- Types ---
interface ShopItem {
    id: string;
    icon: any;
    price: number;
    name: Record<string, string>;
    desc: Record<string, string>;
    type: 'powerup' | 'skin';
}

// --- Constants ---
const SHOP_ITEMS: ShopItem[] = [
    { id: 'shield', icon: Shield, price: 50, name: { ru: 'Защита', en: 'Shield', tr: 'Kalkan' }, desc: { ru: '+1 жизнь на одну игру', en: '+1 life for one game', tr: 'Bir oyun için +1 can' }, type: 'powerup' },
    { id: 'boost', icon: Zap, price: 100, name: { ru: 'Буст x2', en: 'Boost x2', tr: 'Takviye x2' }, desc: { ru: 'x2 звезды на одну игру', en: 'x2 stars for one game', tr: 'Bir oyun için x2 yıldız' }, type: 'powerup' },
    { id: 'master', icon: Award, price: 500, name: { ru: 'Знаток', en: 'Master', tr: 'Usta' }, desc: { ru: 'Золотой телевизор', en: 'Gold TV Frame', tr: 'Altın TV Çerçevesi' }, type: 'skin' },
    { id: 'tv_red', icon: Tv, price: 200, name: { ru: 'Красный ТВ', en: 'Red TV', tr: 'Kırmızı TV' }, desc: { ru: 'Красный корпус', en: 'Red body', tr: 'Kırmızı gövde' }, type: 'skin' },
    { id: 'tv_silver', icon: Palette, price: 300, name: { ru: 'Серебряный ТВ', en: 'Silver TV', tr: 'Gümüş TV' }, desc: { ru: 'Металлический блеск', en: 'Silver body', tr: 'Gümüş gövde' }, type: 'skin' }
];

// --- UI Components (Кратко, для экономии места) ---
const Toast: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-full flex justify-center px-4">
            <div className="bg-soviet-dark/95 text-white px-6 py-3 rounded-full border-2 border-black shadow-lg flex items-center gap-3 animate-slide-up">
                <Info size={18} className="text-soviet-gold" />
                <span className="font-oswald font-bold text-xs uppercase text-center">{message}</span>
            </div>
        </div>
    );
};

const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; variant?: any; className?: string; disabled?: boolean; fullWidth?: boolean; rounded?: boolean; }> = ({ children, onClick, variant = 'primary', className = '', disabled = false, fullWidth = false, rounded = false }) => {
    const variants: any = { primary: "bg-soviet-red text-white", secondary: "bg-soviet-gold text-soviet-dark", accent: "bg-soviet-green text-white", correct: "bg-soviet-green text-white", wrong: "bg-soviet-red text-white" };
    return (
        <button onClick={disabled ? undefined : onClick} className={`relative font-oswald uppercase font-bold py-3 px-6 transition-all active:translate-y-1 border-2 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${rounded ? 'rounded-2xl' : ''} ${disabled ? 'opacity-50 grayscale' : ''} ${className}`}>
            {children}
        </button>
    );
};

const TVFrame: React.FC<{ imageUrl: string; label: string; skin?: string }> = ({ imageUrl, label, skin }) => {
    const getSkinStyles = () => {
        switch(skin) {
            case 'master': return 'bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 border-yellow-800';
            case 'tv_red': return 'bg-soviet-red border-red-900';
            case 'tv_silver': return 'bg-gradient-to-br from-gray-300 via-white to-gray-500 border-gray-600';
            default: return 'wood-pattern border-[#2a110a]';
        }
    };
    return (
        <div className="relative w-full max-w-md mx-auto p-4 animate-slide-up">
            <div className={`${getSkinStyles()} p-4 rounded-xl border-4 shadow-xl relative`}>
                <div className="flex gap-4 items-stretch">
                    <div className="flex-1 aspect-[4/3] bg-black rounded-lg border-2 border-black relative overflow-hidden">
                        <img src={imageUrl} alt="Quiz" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none"></div>
                    </div>
                </div>
                <div className="absolute bottom-[-8px] left-6 bg-soviet-dark text-soviet-gold text-[8px] font-bold px-1.5 border border-black uppercase">{label}</div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [gameState, setGameState] = useState<GameState>('menu');
    const [lang, setLang] = useState<Language>('ru');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [maxLives, setMaxLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [stars, setStars] = useState(0);
    const [isWrong, setIsWrong] = useState(false);
    
    const [stats, setStats] = useState<PlayerStats>({ highScore: 0, totalStars: 0 });
    const [purchasedSkins, setPurchasedSkins] = useState<Set<string>>(new Set(['default']));
    const [activePowerups, setActivePowerups] = useState<Set<string>>(new Set());
    const [activeTvSkin, setActiveTvSkin] = useState<string>('default');

    const [toast, setToast] = useState<string | null>(null);
    const [purchaseModal, setPurchaseModal] = useState<{item: ShopItem, success: boolean} | null>(null);
    const [cinemaCartoon, setCinemaCartoon] = useState<Cartoon | null>(null);

    const T = TRANSLATIONS[lang];

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // --- Logic for saving and checking environment ---
    const isVkEnv = typeof window !== 'undefined' && window.location.search.includes('vk_');

    useEffect(() => {
        const initGame = async () => {
            // 1. Сначала грузим из LocalStorage (для APK)
            const localHS = localStorage.getItem('highScore');
            const localStars = localStorage.getItem('totalStars');
            const localSkins = localStorage.getItem('purchasedSkins');
            const localActiveSkin = localStorage.getItem('activeSkin');

            if (localHS || localStars) {
                setStats({
                    highScore: parseInt(localHS || '0'),
                    totalStars: parseInt(localStars || '0')
                });
            }
            if (localSkins) {
                try { setPurchasedSkins(new Set(JSON.parse(localSkins))); } catch(e) {}
            }
            if (localActiveSkin) setActiveTvSkin(localActiveSkin);

            // 2. Инициализируем VK только если мы в ВК
            if (isVkEnv) {
                try {
                    await vkBridge.send('VKWebAppInit');
                    const storage = await vkBridge.send('VKWebAppStorageGet', { 
                        keys: ['highScore', 'totalStars', 'purchasedSkins', 'activeSkin'] 
                    });
                    
                    if (storage?.keys) {
                        storage.keys.forEach(k => {
                            if (!k.value) return;
                            if (k.key === 'highScore') setStats(s => ({ ...s, highScore: Math.max(s.highScore, parseInt(k.value)) }));
                            if (k.key === 'totalStars') setStats(s => ({ ...s, totalStars: Math.max(s.totalStars, parseInt(k.value)) }));
                            if (k.key === 'purchasedSkins') {
                                try { 
                                    const skins = JSON.parse(k.value);
                                    setPurchasedSkins(prev => new Set([...Array.from(prev), ...skins]));
                                } catch(e) {}
                            }
                            if (k.key === 'activeSkin') setActiveTvSkin(k.value);
                        });
                    }
                } catch (e) {
                    console.warn("VK Bridge failed, proceeding with local storage");
                }
            }
        };
        initGame();
    }, [isVkEnv]);

    const saveProgress = (newStats: PlayerStats, skins?: Set<string>, activeSkin?: string) => {
        // Всегда сохраняем в LocalStorage
        localStorage.setItem('highScore', newStats.highScore.toString());
        localStorage.setItem('totalStars', newStats.totalStars.toString());
        if (skins) localStorage.setItem('purchasedSkins', JSON.stringify(Array.from(skins)));
        if (activeSkin) localStorage.setItem('activeSkin', activeSkin);

        // В облако ВК только если в ВК
        if (isVkEnv) {
            vkBridge.send('VKWebAppStorageSet', { key: 'highScore', value: newStats.highScore.toString() }).catch(() => {});
            vkBridge.send('VKWebAppStorageSet', { key: 'totalStars', value: newStats.totalStars.toString() }).catch(() => {});
            if (skins) vkBridge.send('VKWebAppStorageSet', { key: 'purchasedSkins', value: JSON.stringify(Array.from(skins)) }).catch(() => {});
            if (activeSkin) vkBridge.send('VKWebAppStorageSet', { key: 'activeSkin', value: activeSkin }).catch(() => {});
        }
    };

    // Остальные функции (startGame, nextQuestion и т.д. остаются из вашего кода)
    // НО везде, где вызывается обновление статистики, вызывайте saveProgress
    
    const [currentQuestion, setCurrentQuestion] = useState<Cartoon | null>(null);
    const [options, setOptions] = useState<Cartoon[]>([]);
    const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
    const [lastResult, setLastResult] = useState<{correct: boolean, correctItem: Cartoon} | null>(null);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const startGame = () => {
        setScore(0);
        const bonusLives = activePowerups.has('shield') ? 1 : 0;
        const startL = 3 + bonusLives;
        setLives(startL);
        setMaxLives(startL);
        setLevel(1);
        setStars(0);
        setAnsweredCount(0);
        setSelectedId(null);
        setUsedQuestionIds(new Set());
        setGameState('playing');
        nextQuestion(new Set());
    };

    const nextQuestion = (used: Set<string>) => {
        setSelectedId(null);
        let available = CARTOONS.filter(c => !used.has(c.id));
        if (available.length === 0) { used.clear(); available = CARTOONS; }
        const next = available[Math.floor(Math.random() * available.length)];
        const nextUsed = new Set(used).add(next.id);
        setUsedQuestionIds(nextUsed);
        setCurrentQuestion(next);
        const others = CARTOONS.filter(c => c.id !== next.id).sort(() => 0.5 - Math.random()).slice(0, 3);
        setOptions([next, ...others].sort(() => 0.5 - Math.random()));
    };

    const handleAnswer = (selected: Cartoon) => {
        if (!currentQuestion || selectedId) return;
        setSelectedId(selected.id);
        const isCorrect = selected.id === currentQuestion.id;
        setTimeout(() => {
            if (!isCorrect) {
                setIsWrong(true);
                setTimeout(() => setIsWrong(false), 500);
                setLives(l => l - 1);
            } else {
                setScore(s => s + 100);
                const nextCount = answeredCount + 1;
                setAnsweredCount(nextCount);
                if (nextCount % 3 === 0) {
                    setLevel(prev => prev + 1);
                    const mult = activePowerups.has('boost') ? 2 : 1;
                    setStars(s => s + (1 * mult));
                }
            }
            setLastResult({ correct: isCorrect, correctItem: currentQuestion });
            setGameState('result');
        }, 1000);
    };

    const handleNextResult = () => {
        if (lives <= 0) {
            const newTotalStars = stats.totalStars + stars;
            const newHighScore = Math.max(stats.highScore, score);
            const updated = { highScore: newHighScore, totalStars: newTotalStars };
            setStats(updated);
            setActivePowerups(new Set());
            saveProgress(updated, purchasedSkins, activeTvSkin);
            setGameState('gameover');
        } else {
            setGameState('playing');
            nextQuestion(usedQuestionIds);
        }
    };

    const handlePurchase = (item: ShopItem) => {
        if (item.type === 'skin' && purchasedSkins.has(item.id)) {
            setActiveTvSkin(item.id);
            saveProgress(stats, purchasedSkins, item.id);
            showToast("Дизайн изменен");
            return;
        }
        if (stats.totalStars >= item.price) {
            setPurchaseModal({ item, success: false });
        } else {
            showToast(T.ad_not_ready);
        }
    };

    const confirmPurchase = () => {
        if (!purchaseModal) return;
        const item = purchaseModal.item;
        const newStars = stats.totalStars - item.price;
        let newSkins = new Set(purchasedSkins);
        let newActiveSkin = activeTvSkin;
        let newPowerups = new Set(activePowerups);

        if (item.type === 'skin') {
            newSkins.add(item.id);
            newActiveSkin = item.id;
        } else {
            newPowerups.add(item.id);
        }

        const newStats = { ...stats, totalStars: newStars };
        setStats(newStats);
        setPurchasedSkins(newSkins);
        setActiveTvSkin(newActiveSkin);
        setActivePowerups(newPowerups);
        saveProgress(newStats, newSkins, newActiveSkin);
        setPurchaseModal({ item, success: true });
    };

    // --- Рендеринг экранов (Menu, Shop, Gameover и т.д.) ---
    // Используйте Button, TVFrame и состояния score/stats как в вашем исходном коде
    if (gameState === 'menu') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-soviet-cream overflow-hidden">
                <Toast message={toast} />
                <div className="max-w-md w-full bg-white border-[6px] border-soviet-dark rounded-[40px] shadow-2xl p-8 flex flex-col items-center animate-slide-up relative">
                    <div className="absolute top-0 inset-x-0 h-4 bg-soviet-red"></div>
                    <h1 className="font-ruslan text-5xl text-soviet-red mb-8 mt-4 text-center">СОЮЗМУЛЬТ КВИЗ</h1>
                    
                    <div className="flex gap-4 mb-8 w-full">
                        <div className="flex-1 bg-[#fdf3cc] border-2 border-[#e6d8a2] rounded-2xl p-3 text-center">
                            <div className="text-[10px] font-bold opacity-60">РЕКОРД</div>
                            <div className="text-xl font-bold">{stats.highScore}</div>
                        </div>
                        <div className="flex-1 bg-[#fdf3cc] border-2 border-[#e6d8a2] rounded-2xl p-3 text-center">
                            <div className="text-[10px] font-bold opacity-60">ЗВЕЗДЫ</div>
                            <div className="text-xl font-bold">{stats.totalStars} <Star size={14} className="inline fill-current" /></div>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <Button fullWidth rounded onClick={startGame} className="py-5 text-2xl"><Play fill="currentColor" /> ИГРАТЬ</Button>
                        <Button fullWidth rounded variant="secondary" onClick={() => setGameState('shop')} className="py-5 text-xl"><ShoppingCart /> МАГАЗИН</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'shop') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-soviet-cream">
                <Toast message={toast} />
                <div className="max-w-md w-full bg-white border-4 border-soviet-dark p-6 rounded-[32px] shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-ruslan text-3xl">МАГАЗИН</h2>
                        <div className="bg-soviet-gold px-4 py-1 border-2 border-black rounded-full font-bold">{stats.totalStars} <Star size={16} className="inline fill-current" /></div>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 mb-6">
                        {SHOP_ITEMS.map(item => (
                            <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border-2 border-black/5">
                                <item.icon size={24} className="text-soviet-red" />
                                <div className="flex-1">
                                    <div className="font-bold text-sm">{item.name[lang]}</div>
                                    <div className="text-[10px] opacity-50">{item.desc[lang]}</div>
                                </div>
                                <button onClick={() => handlePurchase(item)} className="bg-white border-2 border-black px-3 py-1 font-bold text-xs rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5">
                                    {purchasedSkins.has(item.id) ? 'ВЫБРАТЬ' : `${item.price} ⭐`}
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button fullWidth variant="secondary" onClick={() => setGameState('menu')} rounded>В МЕНЮ</Button>
                </div>

                {purchaseModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
                         <div className="bg-white border-4 border-black p-6 rounded-[32px] w-full max-w-xs text-center">
                            {purchaseModal.success ? (
                                <>
                                    <CheckCircle2 size={48} className="mx-auto text-soviet-green mb-4" />
                                    <h3 className="font-bold mb-4">КУПЛЕНО!</h3>
                                    <Button fullWidth onClick={() => setPurchaseModal(null)}>ОК</Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-bold mb-4">КУПИТЬ {purchaseModal.item.name[lang]}?</h3>
                                    <div className="flex gap-2">
                                        <Button className="flex-1" onClick={confirmPurchase}>ДА</Button>
                                        <Button className="flex-1" variant="secondary" onClick={() => setPurchaseModal(null)}>НЕТ</Button>
                                    </div>
                                </>
                            )}
                         </div>
                    </div>
                )}
            </div>
        );
    }

    if (gameState === 'playing' && currentQuestion) {
        return (
            <div className="min-h-screen w-full flex flex-col bg-soviet-cream relative">
                <Toast message={toast} />
                <div className="bg-soviet-red border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center text-white">
                    <div className="bg-white text-soviet-red px-3 py-1 border-2 border-black font-bold rounded-lg shadow-md">СЧЕТ: {score}</div>
                    <div className="flex gap-1">
                        {[...Array(maxLives)].map((_, i) => (
                            <Heart key={i} size={20} fill={i < lives ? "white" : "transparent"} stroke="white" />
                        ))}
                    </div>
                    <button onClick={() => setGameState('paused')} className="bg-white p-2 border-2 border-black rounded-full text-soviet-dark"><Settings size={20} /></button>
                </div>
                
                <div className="flex-1 p-4 flex flex-col items-center">
                    <TVFrame imageUrl={currentQuestion.imageUrl} label="РУБИН-312" skin={activeTvSkin} />
                    <div className="grid grid-cols-1 gap-3 w-full max-w-md mt-6">
                        {options.map((opt, idx) => (
                            <Button 
                                key={opt.id} 
                                fullWidth 
                                rounded 
                                variant={selectedId === opt.id ? (opt.id === currentQuestion.id ? 'correct' : 'wrong') : 'secondary'}
                                disabled={!!selectedId}
                                onClick={() => handleAnswer(opt)}
                                className="text-left justify-start"
                            >
                                <span className="opacity-50 mr-2">{idx + 1}.</span> {opt[lang].title}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'result' && lastResult) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-soviet-dark/20 backdrop-blur-md">
                <div className="bg-white border-4 border-black p-6 rounded-[40px] shadow-2xl max-w-md w-full animate-slide-up">
                    <div className={`text-center py-2 px-8 border-2 border-black rounded-full font-ruslan text-2xl mx-auto mb-6 -mt-10 shadow-lg ${lastResult.correct ? 'bg-soviet-green text-white' : 'bg-soviet-red text-white'}`}>
                        {lastResult.correct ? 'ПРАВИЛЬНО!' : 'ОШИБКА!'}
                    </div>
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-4 border-2 border-black">
                        <img src={lastResult.correctItem.imageUrl} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2 uppercase">{lastResult.correctItem[lang].title}</h3>
                    <p className="text-center italic opacity-60 mb-8 px-4">"{lastResult.correctItem[lang].desc}"</p>
                    <Button fullWidth rounded onClick={handleNextResult}>ДАЛЕЕ <Clapperboard size={18} /></Button>
                </div>
            </div>
        );
    }

    if (gameState === 'gameover') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-soviet-dark text-white">
                <h1 className="font-ruslan text-6xl mb-4">КОНЕЦ ФИЛЬМА</h1>
                <div className="bg-white text-soviet-dark p-8 rounded-[40px] border-4 border-black text-center mb-8 shadow-2xl">
                    <div className="text-sm opacity-50 mb-1">ВАШ РЕЗУЛЬТАТ</div>
                    <div className="text-6xl font-bold text-soviet-red mb-4">{score}</div>
                    <div className="inline-flex items-center gap-2 bg-soviet-gold px-4 py-1 border-2 border-black rounded-full font-bold">+{stars} <Star size={18} fill="currentColor" /></div>
                </div>
                <div className="w-full max-w-xs space-y-4">
                    <Button fullWidth rounded onClick={startGame} className="py-4">ЗАНОВО</Button>
                    <Button fullWidth rounded variant="secondary" onClick={() => setGameState('menu')}>В МЕНЮ</Button>
                </div>
            </div>
        );
    }

    if (gameState === 'paused') {
        return (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
                <div className="bg-white border-4 border-black p-8 rounded-[40px] w-full max-w-xs text-center">
                    <h2 className="font-ruslan text-4xl mb-8">ПАУЗА</h2>
                    <div className="space-y-4">
                        <Button fullWidth onClick={() => setGameState('playing')}>ПРОДОЛЖИТЬ</Button>
                        <Button fullWidth variant="secondary" onClick={() => setGameState('menu')}>В МЕНЮ</Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
