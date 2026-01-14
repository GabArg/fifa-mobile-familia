
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { PlayerSelector } from '../components/PlayerSelector';
import MatchVersus from '../components/MatchVersus';

export const Tournament3View = ({ onBack, onToggleUI }) => {
    const [step, setStep] = useState('SELECT');
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        setPlayers(StorageService.getPlayers());
    }, []);

    const togglePlayer = (p) => {
        if (selectedPlayers.find(sp => sp.id === p.id)) {
            setSelectedPlayers(selectedPlayers.filter(sp => sp.id !== p.id));
        } else {
            if (selectedPlayers.length < 3) {
                setSelectedPlayers([...selectedPlayers, p]);
            }
        }
    };

    const startTournament = () => {
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

        // Update Standings immediately? Or assume calculation
        calculateStandings(newMatches);

        // Save to storage
        StorageService.addMatch({
            type: 'tournament3',
            players: [m.home.id, m.away.id],
            scores: { [m.home.id]: parseInt(m.scoreHome), [m.away.id]: parseInt(m.scoreAway) }
        });
    };

    const calculateStandings = (currentMatches) => {
        // Initialize map
        const stats = {};
        selectedPlayers.forEach(p => {
            stats[p.id] = { player: p, points: 0, gf: 0, gc: 0, played: 0 };
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

                if (sH > sA) stats[m.home.id].points += 3;
                else if (sA > sH) stats[m.away.id].points += 3;
                else {
                    stats[m.home.id].points += 1;
                    stats[m.away.id].points += 1;
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

            // Delay for effect, then switch to RESULT view
            setTimeout(() => {
                setStep('RESULT');
                if (onToggleUI) onToggleUI(false);
            }, 1500);
        }
    };

    const handleBack = () => {
        if (onToggleUI) onToggleUI(true);
        onBack();
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
            <PlayerSelector
                players={players}
                selectedPlayers={selectedPlayers}
                onToggle={togglePlayer}
                onConfirm={startTournament}
                onCancel={onBack}
                title="Selecciona 3 Jugadores"
                confirmText="Comenzar Triangular"
                requiredCount={3}
            />
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
                                label={match.round}
                            />
                        </div>
                    ))}
                </div>

                {/* Standings Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Tabla de Posiciones</h2>
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Pos</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Jugador</th>
                                    <th className="p-4 text-center text-xs font-bold text-gray-400 uppercase">PTS</th>
                                    <th className="p-4 text-center text-xs font-bold text-gray-400 uppercase">GF</th>
                                    <th className="p-4 text-center text-xs font-bold text-gray-400 uppercase">GC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.length > 0 ? standings.map((row, i) => (
                                    <tr key={i} className={`border-b border-white/5 transition-colors ${i === 0 ? 'bg-[#ccff00]/10' : 'hover:bg-white/5'}`}>
                                        <td className="p-4 font-mono font-bold text-white/50">#{i + 1}</td>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                                {row.player.image ? <img src={row.player.image} className="w-full h-full object-cover" /> : null}
                                            </div>
                                            <span className={`font-bold ${i === 0 ? 'text-[#ccff00]' : 'text-white'}`}>{row.player.name}</span>
                                        </td>
                                        <td className="p-4 text-center font-black text-xl text-white">{row.points}</td>
                                        <td className="p-4 text-center font-mono text-white/70">{row.gf}</td>
                                        <td className="p-4 text-center font-mono text-white/70">{row.gc}</td>
                                    </tr>
                                )) : (
                                    selectedPlayers.map((p, i) => (
                                        <tr key={p.id} className="border-b border-white/5 text-white/30">
                                            <td className="p-4">-</td>
                                            <td className="p-4">{p.name}</td>
                                            <td className="p-4 text-center">0</td>
                                            <td className="p-4 text-center">0</td>
                                            <td className="p-4 text-center">0</td>
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
