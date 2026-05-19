
import { useState, useRef } from 'react';
import musicaFondo from "./assets/picky.mp3";


// ─── Square ───────────────────────────────────────────────────────────────────
function Square({ value, onSquareClick, isWinning }) {
  return (
    <button
      className={`square ${isWinning ? 'square--winning' : ''}`}
      onClick={onSquareClick}
    >
      {value}
    </button>
  );
}
//hollis
// ─── Board ────────────────────────────────────────────────────────────────────
function Board({ xIsNext, squares, onPlay, size, playerNames }) {
  const winnerInfo = calculateWinner(squares, size);

  function handleClick(i) {
    if (winnerInfo || squares[i]) return;
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    onPlay(nextSquares);
  }

  // Mensaje dinámico de turno usando el nombre del jugador
  let status;
  if (winnerInfo) {
    const winnerSymbol = winnerInfo.winner;
    const winnerName = winnerSymbol === 'X' ? playerNames[0] : playerNames[1];
    status = `¡Ganador: ${winnerName} (${winnerSymbol})!`;
  } else if (squares.every(Boolean)) {
    status = '¡Empate!';
  } else {
    const currentName = xIsNext ? playerNames[0] : playerNames[1];
    const currentSymbol = xIsNext ? 'X' : 'O';
    status = `Turno de: ${currentName} (${currentSymbol})`;
  }

  const winningSquares = winnerInfo ? winnerInfo.line : [];

  // Renderizar el tablero de forma dinámica según el tamaño
  const rows = [];
  for (let row = 0; row < size; row++) {
    const cols = [];
    for (let col = 0; col < size; col++) {
      const index = row * size + col;
      cols.push(
        <Square
          key={index}
          value={squares[index]}
          onSquareClick={() => handleClick(index)}
          isWinning={winningSquares.includes(index)}
        />
      );
    }
    rows.push(
      <div className="board-row" key={row}>
        {cols}
      </div>
    );
  }

  return (
    <>
      <div className="status">{status}</div>
      {rows}
    </>
  );
}

// ─── SetupScreen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [size, setSize] = useState(3);

  function handleSubmit() {
    const p1 = name1.trim() || 'Jugador 1';
    const p2 = name2.trim() || 'Jugador 2';
    onStart([p1, p2], size);
  }

  return (
    <div className="setup-screen">
      <h1 className="setup-title">Tres en Raya</h1>
      <p className="setup-subtitle">Configura la partida antes de comenzar</p>

      <div className="setup-card">
        <div className="setup-section">
          <h2>Jugadores</h2>
          <div className="setup-field">
            <label>
              <span className="symbol x-symbol">X</span> Jugador 1
            </label>
            <input
              type="text"
              placeholder="Nombre del Jugador 1"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              maxLength={20}
            />
          </div>
          <div className="setup-field">
            <label>
              <span className="symbol o-symbol">O</span> Jugador 2
            </label>
            <input
              type="text"
              placeholder="Nombre del Jugador 2"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        <div className="setup-section">
          <h2>Tamaño del tablero</h2>
          <div className="size-options">
            {[3, 4, 5, 6].map((s) => (
              <button
                key={s}
                className={`size-btn ${size === s ? 'size-btn--active' : ''}`}
                onClick={() => setSize(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>
          <p className="size-hint">
            En un tablero {size}×{size} gana quien complete {size} en línea.
          </p>
        </div>

        <button className="start-btn" onClick={handleSubmit}>
          ¡Comenzar partida!
        </button>
      </div>
    </div>
  );
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export default function Game() {
  const [playerNames, setPlayerNames] = useState(null);
  const [boardSize, setBoardSize] = useState(3);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
 
  // Música de fondo
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
 
  function toggleMusic() {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }
 
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
 
  // Contador de turnos: el número de casillas ocupadas en el estado actual
  const turnCount = currentSquares.filter(Boolean).length;
 
  function handleStart(names, size) {
    setPlayerNames(names);
    setBoardSize(size);
    setHistory([Array(size * size).fill(null)]);
    setCurrentMove(0);
  }
 
  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }
 
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }
 
  // Botón de reinicio: resetea el estado sin recargar la página
  function handleReset() {
    setHistory([Array(boardSize * boardSize).fill(null)]);
    setCurrentMove(0);
  }
 
  // Botón para volver a la pantalla de configuración
  function handleNewGame() {
    setPlayerNames(null);
  }
 
  if (!playerNames) {
    return <SetupScreen onStart={handleStart} />;
  }
 
  const moves = history.map((squares, move) => {
    let label;
    if (move === 0) {
      label = 'Inicio del juego';
    } else {
      // La jugada #1 la hizo X (move impar → O, move par → X)
      // move=1 → fue el turno 0 → xIsNext era true → jugó X → playerNames[0]
      const whoPlayed = move % 2 === 1 ? playerNames[0] : playerNames[1];
      const symbol = move % 2 === 1 ? 'X' : 'O';
      label = `Jugada #${move} — ${whoPlayed} (${symbol})`;
    }
    return (
      <li key={move} className={move === currentMove ? 'move-active' : ''}>
        <button onClick={() => jumpTo(move)}>{label}</button>
      </li>
    );
  });
 
  return (
    <div className="game-wrapper">
      <audio ref={audioRef} src={musicaFondo} loop />
 
      <h1 className="game-title">
        Tres en Raya
        <button className="btn-music" onClick={toggleMusic}>
          {playing ? '🔇' : '🎵'}
        </button>
      </h1>
 
      <div className="players-banner">
        <div className="player-tag">
          <span className="symbol x-symbol">X</span>
          <span>{playerNames[0]}</span>
        </div>
        <span className="vs-label">vs</span>
        <div className="player-tag">
          <span className="symbol o-symbol">O</span>
          <span>{playerNames[1]}</span>
        </div>
      </div>
 
      {/* Contador de turnos */}
      <div className="turn-counter">
        Turnos jugados: <strong>{turnCount}</strong>
      </div>
 
      <div className="game">
        <div className="game-board">
          <Board
            xIsNext={xIsNext}
            squares={currentSquares}
            onPlay={handlePlay}
            size={boardSize}
            playerNames={playerNames}
          />
 
          {/* Botones de acción */}
          <div className="action-buttons">
            <button className="btn btn--reset" onClick={handleReset}>
              🔄 Reiniciar partida
            </button>
            <button className="btn btn--new" onClick={handleNewGame}>
              ⚙️ Nueva configuración
            </button>
          </div>
        </div>
 
        <div className="game-info">
          <h3>Historial</h3>
          <ol>{moves}</ol>
        </div>
      </div>
    </div>
  );
}
 

// ─── calculateWinner ──────────────────────────────────────────────────────────
// Lógica adaptada al tamaño del tablero: gana quien complete `size` en línea.
function calculateWinner(squares, size) {
  const winLength = size; // en NxN gana quien complete N en línea

  // Filas
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const start = row * size + col;
      const line = Array.from({ length: winLength }, (_, k) => start + k);
      const winner = checkLine(squares, line);
      if (winner) return { winner, line };
    }
  }

  // Columnas
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLength; row++) {
      const line = Array.from({ length: winLength }, (_, k) => (row + k) * size + col);
      const winner = checkLine(squares, line);
      if (winner) return { winner, line };
    }
  }

  // Diagonales ↘
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const line = Array.from({ length: winLength }, (_, k) => (row + k) * size + (col + k));
      const winner = checkLine(squares, line);
      if (winner) return { winner, line };
    }
  }

  // Diagonales ↙
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = winLength - 1; col < size; col++) {
      const line = Array.from({ length: winLength }, (_, k) => (row + k) * size + (col - k));
      const winner = checkLine(squares, line);
      if (winner) return { winner, line };
    }
  }

  return null;
}

function checkLine(squares, line) {
  const first = squares[line[0]];
  if (!first) return null;
  return line.every((i) => squares[i] === first) ? first : null;
}