
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { PlayerSelector } from '../components/PlayerSelector';
import MatchVersus from '../components/MatchVersus';

export const Tournament3View = ({ onBack, onToggleUI, isAdmin }) => {
    const [step, setStep] = useState('SELECT');
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        // Crash Recovery: Check for temp data
        const temp = localStorage.getItem('FIFA_TEMP_TOURNEY3');
        if (temp) {
            try {
                const data = JSON.parse(temp);
                setPlayers(data.players);
                setSelectedPlayers(data.selectedPlayers);
                setMatches(data.matches);
                // Re-calculate or restore standings? Better to recalc or store too.
                // Restoring standings is safer if we want exact state
                if (data.standings) setStandings(data.standings);
                if (data.step) setStep(data.step);
            } catch (e) {
                console.error("Error recovering tournament", e);
                localStorage.removeItem('FIFA_TEMP_TOURNEY3');
                setPlayers(StorageService.getPlayers());
            }
        } else {
            setPlayers(StorageService.getPlayers());
        }
    }, []);

    // Save state on change
    useEffect(() => {
        if (step === 'PLAY' && matches.length > 0) {
            localStorage.setItem('FIFA_TEMP_TOURNEY3', JSON.stringify({
                players,
                selectedPlayers,
                matches,
                standings,
                step
            }));
        } else if (step === 'RESULT' || step === 'SELECT') {
            // Maybe don't clear immediately on RESULT to allow refresh?
            // Only clear on Back/Exit
        }
    }, [players, selectedPlayers, matches, standings, step]);

    const togglePlayer = (p) => {
        if (!isAdmin) return; // Block selection
        if (selectedPlayers.find(sp => sp.id === p.id)) {
            setSelectedPlayers(selectedPlayers.filter(sp => sp.id !== p.id));
        } else {
            if (selectedPlayers.length < 3) {
                setSelectedPlayers([...selectedPlayers, p]);
            }
        }
    };

    const startTournament = () => {
        if (!isAdmin) {
            alert("Solo admin");
            return;
        }
        if (selectedPlayers.length === 3) {
            // Triangular Matches: Double Leg (Ida y Vuelta) Grouped by Pair
            const p1 = selectedPlayers[0];
            const p2 = selectedPlayers[1];
            const p3 = selectedPlayers[2];

            setMatches([
                // Pair 1: P1 vs P2
                { id: 1, home: p1, away: p2, scoreHome: '', scoreAway: '', isFinished: false, round: 'IDA' },
                { id: 2, home: p2, away: p1, scoreHome: '', scoreAway: '', isFinished: false, round: 'VUELTA' },

                // Pair 2: P2 vs P3
                { id: 3, home: p2, away: p3, scoreHome: '', scoreAway: '', isFinished: false, round: 'IDA' },
                { id: 4, home: p3, away: p2, scoreHome: '', scoreAway: '', isFinished: false, round: 'VUELTA' },

                // Pair 3: P3 vs P1
                { id: 5, home: p3, away: p1, scoreHome: '', scoreAway: '', isFinished: false, round: 'IDA' },
                { id: 6, home: p1, away: p3, scoreHome: '', scoreAway: '', isFinished: false, round: 'VUELTA' }
            ]);
            setStep('PLAY');
        }
    };

    const updateScore = (index, field, val) => {
        if (val < 0) return;
        const newMatches = [...matches];
        // Map MatchVersus 'score1'/'score2'
        if (field === 'score1') newMatches[index].scoreHome = val;
        if (field === 'score2') newMatches[index].scoreAway = val;
        setMatches(newMatches);
    };

    const finishMatch = (index) => {
        const m = matches[index];
        if (m.scoreHome === '' || m.scoreAway === '') return;

        const newMatches = [...matches];
        newMatches[index].isFinished = true;
        setMatches(newMatches);

        // Update Standings
        calculateStandings(newMatches);

        // Save to storage (or Update if editing)
        if (m.dbId) {
            StorageService.updateMatch({
                id: m.dbId,
                type: 'tournament3', // Keep original type
                date: m.date, // Keep original date
                players: [m.home.id, m.away.id],
                scores: { [m.home.id]: parseInt(m.scoreHome), [m.away.id]: parseInt(m.scoreAway) }
            });
        } else {
            const savedMatch = StorageService.addMatch({
                type: 'tournament3',
                players: [m.home.id, m.away.id],
                scores: { [m.home.id]: parseInt(m.scoreHome), [m.away.id]: parseInt(m.scoreAway) }
            });
            // Update match with DB ID to allow future edits
            newMatches[index].dbId = savedMatch.id;
            newMatches[index].date = savedMatch.date;
            setMatches(newMatches);
        }
    };

    const editMatch = (index) => {
        // Unlock match
        const newMatches = [...matches];
        newMatches[index].isFinished = false;
        setMatches(newMatches);
        // Important: We don't delete from DB yet, we just unlock UI. 
        // When 'finishMatch' is called again, it will UPDATE the existing ID.
    };

    const calculateStandings = (currentMatches) => {
        // Initialize map
        const stats = {};
        selectedPlayers.forEach(p => {
            selectedPlayers.forEach(p => {
                stats[p.id] = { player: p, points: 0, gf: 0, gc: 0, played: 0, won: 0, drawn: 0, lost: 0 };
            });
        });

        currentMatches.forEach(m => {
            if (m.isFinished) {
                const sH = parseInt(m.scoreHome);
                const sA = parseInt(m.scoreAway);

                stats[m.home.id].played++;
                stats[m.away.id].played++;
                stats[m.home.id].gf += sH;
                stats[m.home.id].gc += sA;
                stats[m.away.id].gf += sA;
                stats[m.away.id].gc += sH;

                if (sH > sA) {
                    stats[m.home.id].points += 3;
                    stats[m.home.id].won++;
                    stats[m.away.id].lost++;
                }
                else if (sA > sH) {
                    stats[m.away.id].points += 3;
                    stats[m.away.id].won++;
                    stats[m.home.id].lost++;
                }
                else {
                    stats[m.home.id].points += 1;
                    stats[m.home.id].drawn++;
                    stats[m.away.id].points += 1;
                    stats[m.away.id].drawn++;
                }
            }
        });

        // Convert to array and sort
        const sorted = Object.values(stats).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = a.gf - a.gc;
            const gdB = b.gf - b.gc;
            if (gdB !== gdA) return gdB - gdA;
            return b.gf - a.gf;
        });

        setStandings(sorted);

        // Check if all finished
        if (currentMatches.every(m => m.isFinished)) {
            setWinner(sorted[0].player);

            // Save Tournament Result
            StorageService.saveTournament({
                id: Date.now().toString(),
                type: 'tourney3',
                date: new Date().toISOString(),
                standings: sorted.map((s, i) => ({
                    playerId: s.player.id,
                    rank: i + 1
                }))
            });

            // Clear Temp Data
            localStorage.removeItem('FIFA_TEMP_TOURNEY3');

            // Delay for effect, then switch to RESULT view
            setTimeout(() => {
                setStep('RESULT');
                if (onToggleUI) onToggleUI(false);
            }, 1500);
        }
    };

    const handleBack = () => {
        if (step === 'PLAY' || step === 'RESULT') {
            if (window.confirm("¿Seguro que quieres salir? Se perderá el progreso del torneo actual si no lo has finalizado.")) {
                localStorage.removeItem('FIFA_TEMP_TOURNEY3');
                if (onToggleUI) onToggleUI(true);
                onBack();
            }
        } else {
            if (onToggleUI) onToggleUI(true);
            onBack();
        }
    };

    if (step === 'RESULT') {
        const [first, second, third] = standings;
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', marginBottom: '4rem', textShadow: '0 0 30px rgba(204,255,0,0.5)', fontStyle: 'italic' }}>
                    ¡TORNEO FINALIZADO!
                </h2>

                {/* Podium Container */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3rem', marginBottom: '4rem' }}>

                    {/* 2nd Place */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0, animation: 'fadeInUp 0.8s forwards 0.5s' }}>
                        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #C0C0C0', overflow: 'hidden', marginBottom: '0.5rem', boxShadow: '0 0 20px rgba(192,192,192,0.3)', background: '#222' }}>
                                {second?.player.image ? <img src={second.player.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C0C0C0' }}>{second?.player.name}</div>
                            <div style={{ fontSize: '1rem', color: 'gray' }}>{second?.points} pts</div>
                        </div>
                        <div style={{ width: '100px', height: '140px', background: 'linear-gradient(to top, #333, #666)', borderTop: '6px solid #C0C0C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)' }}>2</div>
                    </div>

                    {/* 1st Place */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, animation: 'fadeInUp 0.8s forwards' }}>
                        <div style={{ marginBottom: '2rem', textAlign: 'center', transform: 'scale(1.1)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '-1.5rem', zIndex: 20, filter: 'drop-shadow(0 0 10px gold)' }}>👑</div>
                            <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '6px solid #ffd700', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 0 50px rgba(255,215,0,0.6)', background: 'black' }}>
                                {first?.player.image ? <img src={first.player.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '2px' }}>{first?.player.name}</div>
                            <div style={{ fontSize: '1.2rem', color: 'white' }}>{first?.points} pts</div>
                        </div>
                        <div style={{ width: '140px', height: '200px', background: 'linear-gradient(to top, #ccff00, #aacc00)', borderTop: '6px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', fontWeight: '900', color: 'rgba(0,0,0,0.3)', boxShadow: '0 0 60px rgba(204,255,0,0.3)' }}>1</div>
                    </div>

                    {/* 3rd Place */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0, animation: 'fadeInUp 0.8s forwards 1s' }}>
                        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #CD7F32', overflow: 'hidden', marginBottom: '0.5rem', boxShadow: '0 0 20px rgba(205,127,50,0.3)', background: '#222' }}>
                                {third?.player.image ? <img src={third.player.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#CD7F32' }}>{third?.player.name}</div>
                            <div style={{ fontSize: '1rem', color: 'gray' }}>{third?.points} pts</div>
                        </div>
                        <div style={{ width: '100px', height: '100px', background: 'linear-gradient(to top, #333, #555)', borderTop: '6px solid #CD7F32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)' }}>3</div>
                    </div>
                </div>

                <button
                    onClick={handleBack}
                    style={{
                        padding: '1.5rem 4rem',
                        backgroundColor: '#ccff00',
                        color: 'black',
                        fontWeight: '900',
                        borderRadius: '999px',
                        border: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        cursor: 'pointer',
                        marginTop: '3rem',
                        fontSize: '1.2rem',
                        boxShadow: '0 0 30px rgba(204,255,0,0.4)',
                        transition: 'transform 0.2s'
                    }}
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    if (step === 'SELECT') {
        return (
            <div className="relative h-full">
                {!isAdmin && (
                    <div className="absolute top-0 right-0 m-4 z-50 bg-red-600/20 border border-red-500 text-red-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        🔒 Modo Espectador (No Admin)
                    </div>
                )}
                <PlayerSelector
                    players={players}
                    selectedPlayers={selectedPlayers}
                    onToggle={(p) => isAdmin ? togglePlayer(p) : alert("Solo admin")}
                    onConfirm={startTournament}
                    onCancel={onBack}
                    title="Selecciona 3 Jugadores"
                    confirmText={isAdmin ? "Comenzar Triangular" : "Solo Admin"}
                    requiredCount={3}
                />
            </div>
        );
    }

    return (
        <div className="pt-24 px-4 pb-20 max-w-5xl mx-auto min-h-screen">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-lg">TRIANGULAR</h1>
                <div className="h-1 w-24 bg-[#00f0ff] mx-auto mt-4 rounded-full shadow-[0_0_15px_#00f0ff]"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Matches Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Partidos</h2>
                    {matches.map((match, index) => (
                        <div key={match.id} className="opacity-0 animate-fadeInUp" style={{ animationDelay: `${index * 150}ms`, opacity: 1 }}>
                            <MatchVersus
                                player1={match.home}
                                player2={match.away}
                                score1={match.scoreHome}
                                score2={match.scoreAway}
                                isFinished={match.isFinished}
                                onScoreChange={(field, val) => updateScore(index, field, val)}
                                onFinish={() => finishMatch(index)}
                                onEdit={() => editMatch(index)} // Pass edit handler
                                label={match.round}
                                readOnly={!isAdmin} // Pass readOnly
                            />
                        </div>
                    ))}
                </div>

                {/* Standings Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Tabla de Posiciones</h2>
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <table className="data-table">
                            <thead>
                                <tr className="table-head-row">
                                    <th className="p-3 text-center w-12">Pos</th>
                                    <th className="p-3">Jugador</th>
                                    <th className="p-3 text-center">PTS</th>
                                    <th className="p-3 text-center">PJ</th>
                                    <th className="p-3 text-center">G</th>
                                    <th className="p-3 text-center">E</th>
                                    <th className="p-3 text-center">P</th>
                                    <th className="p-3 text-center">GF</th>
                                    <th className="p-3 text-center">GC</th>
                                    <th className="p-3 text-center">DG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.length > 0 ? standings.map((row, i) => (
                                    <tr key={i} className="table-row">
                                        <td className={`p-3 text-center font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/50'}`}>{i + 1}</td>
                                        <td className="p-3 font-bold player-cell">
                                            <div className="player-avatar-small">
                                                {row.player.image ? <img src={row.player.image} alt={row.player.name} /> : <span>{row.player.name.charAt(0)}</span>}
                                            </div>
                                            {row.player.name}
                                        </td>
                                        <td className="p-3 text-center font-bold text-xl text-[--primary]">{row.points}</td>
                                        <td className="p-3 text-center text-white/70">{row.played}</td>
                                        <td className="p-3 text-center text-green-400/80">{row.won}</td>
                                        <td className="p-3 text-center text-yellow-400/80">{row.drawn}</td>
                                        <td className="p-3 text-center text-red-400/80">{row.lost}</td>
                                        <td className="p-3 text-center text-white/60">{row.gf}</td>
                                        <td className="p-3 text-center text-white/60">{row.gc}</td>
                                        <td className="p-3 text-center text-white/40 font-mono text-sm">{row.gf - row.gc > 0 ? `+${row.gf - row.gc}` : row.gf - row.gc}</td>
                                    </tr>
                                )) : (
                                    selectedPlayers.map((p, i) => (
                                        <tr key={p.id} className="table-row text-white/30">
                                            <td className="p-3 text-center">-</td>
                                            <td className="p-3 font-bold player-cell">
                                                <div className="player-avatar-small grayscale opacity-50">
                                                    {p.image ? <img src={p.image} /> : <span>{p.name[0]}</span>}
                                                </div>
                                                {p.name}
                                            </td>
                                            <td className="p-3 text-center">0</td>
                                            <td className="p-3 text-center">0</td>
                                            <td className="p-3 text-center">-</td>
                                            <td className="p-3 text-center">-</td>
                                            <td className="p-3 text-center">-</td>
                                            <td className="p-3 text-center">0</td>
                                            <td className="p-3 text-center">0</td>
                                            <td className="p-3 text-center">0</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {winner && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-[#ccff00]/20 to-transparent rounded-2xl border border-[#ccff00]/30 animate-pulse">
                            <h3 className="text-[#ccff00] font-bold uppercase tracking-widest text-sm mb-2">Campeón</h3>
                            <div className="text-4xl font-black text-white">{winner.name}</div>
                        </div>
                    )}

                    <div className="pt-8">
                        <button
                            onClick={onBack}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl border border-white/10 transition-all uppercase tracking-wider"
                        >
                            Salir del Torneo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
