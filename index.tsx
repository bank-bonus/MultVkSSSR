import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * CONFIGURATION
 * List your images here.
 * Keys are used to reference images in the game code.
 * Values are the paths relative to the project root (or 'public' folder).
 */
const ASSETS = {
  hero: "images/hero.png",
  background: "images/background.png",
  // Add your other images here like:
  // enemy: "images/enemy.png",
  // ground: "images/ground.png",
};

// --- Types ---
type GameState = "LOADING" | "MENU" | "PLAYING" | "ERROR";

interface AssetStatus {
  key: string;
  path: string;
  loaded: boolean;
  error: boolean;
  element: HTMLImageElement;
}

// --- Styles ---
const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#1a1a1a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#fff",
    overflow: "hidden",
  },
  canvas: {
    boxShadow: "0 0 40px rgba(0,0,0,0.5)",
    borderRadius: "8px",
    backgroundColor: "#000",
  },
  uiOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(0,0,0,0.4)",
  },
  card: {
    background: "#2a2a2a",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    maxWidth: "500px",
    width: "90%",
    pointerEvents: "auto" as const,
    textAlign: "center" as const,
    border: "1px solid #333",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1rem",
    color: "#4ade80",
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
  },
  text: {
    marginBottom: "1.5rem",
    lineHeight: "1.6",
    color: "#ccc",
  },
  errorList: {
    textAlign: "left" as const,
    background: "rgba(255, 50, 50, 0.1)",
    border: "1px solid rgba(255, 50, 50, 0.3)",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    listStyle: "none",
  },
  button: {
    background: "#4ade80",
    color: "#000",
    border: "none",
    padding: "12px 24px",
    fontSize: "1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold" as const,
    transition: "background 0.2s",
  },
  debugInfo: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    background: "rgba(0,0,0,0.7)",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
    pointerEvents: "none" as const,
  }
};

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("LOADING");
  const [assets, setAssets] = useState<Record<string, AssetStatus>>({});
  const [failedAssets, setFailedAssets] = useState<string[]>([]);
  
  // 1. Asset Loading System
  useEffect(() => {
    let loadedCount = 0;
    let failedList: string[] = [];
    const assetKeys = Object.keys(ASSETS);
    const totalAssets = assetKeys.length;
    
    if (totalAssets === 0) {
      setGameState("MENU");
      return;
    }

    const newAssets: Record<string, AssetStatus> = {};

    assetKeys.forEach((key) => {
      const path = ASSETS[key as keyof typeof ASSETS];
      const img = new Image();
      
      newAssets[key] = {
        key,
        path,
        loaded: false,
        error: false,
        element: img,
      };

      img.onload = () => {
        newAssets[key].loaded = true;
        loadedCount++;
        checkCompletion();
      };

      img.onerror = () => {
        console.error(`Failed to load asset: ${path}`);
        newAssets[key].error = true;
        newAssets[key].loaded = true; // Mark as "processed" even if failed
        failedList.push(path);
        loadedCount++;
        checkCompletion();
      };

      img.src = path;
    });

    setAssets(newAssets);

    function checkCompletion() {
      if (loadedCount === totalAssets) {
        setFailedAssets(failedList);
        // If items failed, we still let the game start but might warn the user
        setGameState("MENU"); 
      }
    }
  }, []);

  // 2. Game Loop
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let frame = 0;

    // Game Objects
    const player = { x: 100, y: 300, w: 64, h: 64, vy: 0 };
    const gravity = 0.5;
    const jumpForce = -10;
    let groundY = 400;

    // Input Handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && player.y + player.h >= groundY) {
        player.vy = jumpForce;
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const render = () => {
      // Update
      player.vy += gravity;
      player.y += player.vy;
      if (player.y + player.h > groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
      }
      
      // Clear
      ctx.fillStyle = "#333";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Background
      if (assets.background && !assets.background.error) {
         ctx.drawImage(assets.background.element, 0, 0, canvas.width, canvas.height);
      } else {
         // Fallback background
         const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
         grad.addColorStop(0, "#222");
         grad.addColorStop(1, "#111");
         ctx.fillStyle = grad;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Ground
      ctx.fillStyle = "#444";
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Draw Player
      if (assets.hero && !assets.hero.error) {
        ctx.drawImage(assets.hero.element, player.x, player.y, player.w, player.h);
      } else {
        // Fallback Player (Red Box)
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(player.x, player.y, player.w, player.h);
        
        // Label
        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.fillText("HERO?", player.x + 10, player.y + 35);
      }

      // Draw Info
      ctx.fillStyle = "white";
      ctx.font = "16px sans-serif";
      ctx.fillText("Press SPACE to jump", 20, 40);

      frame++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, assets]);

  return (
    <div style={styles.container}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        style={styles.canvas}
      />
      
      {/* --- DEBUG OVERLAY --- */}
      <div style={styles.debugInfo}>
        <div style={{fontWeight: 'bold', marginBottom: 5}}>Asset Debugger</div>
        {Object.values(assets).map((a: AssetStatus) => (
          <div key={a.key} style={{color: a.error ? '#ff5555' : '#55ff55'}}>
            {a.key}: {a.error ? 'FAILED' : 'OK'} ({a.path})
          </div>
        ))}
      </div>

      {/* --- MENU / LOADING UI --- */}
      {gameState === "LOADING" && (
         <div style={styles.uiOverlay}>
           <div style={styles.card}>
             <h1 style={styles.title}>Loading Assets...</h1>
           </div>
         </div>
      )}

      {gameState === "MENU" && (
        <div style={styles.uiOverlay}>
          <div style={styles.card}>
            <h1 style={styles.title}>Game Ready</h1>
            
            {failedAssets.length > 0 ? (
              <div style={{textAlign: 'left'}}>
                 <p style={{color: '#ff8888', fontWeight: 'bold'}}>⚠️ Warning: Some images failed to load.</p>
                 <p style={styles.text}>
                   On <strong>Vercel</strong>, files in a root <code>images</code> folder might not be served correctly.
                   <br/><br/>
                   <strong>Fix:</strong> Create a folder named <code>public</code> in your project root, and move the <code>images</code> folder inside it.
                 </p>
                 <ul style={styles.errorList}>
                   {failedAssets.map(path => (
                     <li key={path}>Missing: {path}</li>
                   ))}
                 </ul>
                 <button 
                  style={{...styles.button, background: '#ff8888', color: '#000'}}
                  onClick={() => setGameState("PLAYING")}
                 >
                   Play Anyway (With Placeholders)
                 </button>
              </div>
            ) : (
              <>
                <p style={styles.text}>All assets loaded successfully!</p>
                <button 
                  style={styles.button}
                  onClick={() => setGameState("PLAYING")}
                >
                  Start Game
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);