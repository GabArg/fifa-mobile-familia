
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { PlayerSelector } from '../components/PlayerSelector';
import { Button } from '../components/Button';
import MatchVersus from '../components/MatchVersus'; // New Component
import { useAudio } from '../hooks/useAudio';

export const DuelView = ({ onBack, isAdmin }) => {
    const [step, setStep] = useState('SELECT'); // SELECT, PLAY, RESULT
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    // Game State
    const [matches, setMatches] = useState([]);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        setPlayers(StorageService.getPlayers());
    }, []);

    const togglePlayer = (p) => {
        if (selectedPlayers.find(sp => sp.id === p.id)) {
            setSelectedPlayers(selectedPlayers.filter(sp => sp.id !== p.id));
        } else {
            if (selectedPlayers.length < 2) {
                setSelectedPlayers([...selectedPlayers, p]);
            }
        }
    };

    const startDuel = () => {
        if (!isAdmin) {
            alert("Solo el administrador puede iniciar duelos.");
            return;
        }
        if (selectedPlayers.length === 2) {
            // Initialize with 2 legs
            setMatches([
                { id: 1, home: selectedPlayers[0], away: selectedPlayers[1], scoreHome: '', scoreAway: '' },
                { id: 2, home: selectedPlayers[1], away: selectedPlayers[0], scoreHome: '', scoreAway: '' }
            ]);
            setStep('PLAY');
        }
    };

    const updateMatchScore = (index, field, value) => {
        if (value < 0) return;
        const newMatches = [...matches];

        // Map MatchVersus 'score1'/'score2' to 'scoreHome'/'scoreAway'
        if (field === 'score1') newMatches[index].scoreHome = value;
        if (field === 'score2') newMatches[index].scoreAway = value;

        setMatches(newMatches);
    };

    const finishDuel = () => {
        // Validation: All scores must be filled
        const incomplete = matches.some(m => m.scoreHome === '' || m.scoreAway === '');
        if (incomplete) return;

        // Save matches to history
        matches.forEach(m => {
            StorageService.addMatch({
                type: 'duel',
                players: [m.home.id, m.away.id],
                scores: { [m.home.id]: parseInt(m.scoreHome), [m.away.id]: parseInt(m.scoreAway) }
            });
        });

        const p1 = selectedPlayers[0];
        const p2 = selectedPlayers[1];

        // Calculate Aggregate
        let p1Goals = 0;
        let p2Goals = 0;

        matches.forEach(m => {
            const homeScore = parseInt(m.scoreHome);
            const awayScore = parseInt(m.scoreAway);

            if (m.home.id === p1.id) {
                p1Goals += homeScore;
                p2Goals += awayScore;
            } else { // p2 home
                p2Goals += homeScore;
                p1Goals += awayScore;
            }
        });

        if (p1Goals === p2Goals) {
            // TIE -> Add Tie Breaker Match
            const nextId = matches.length + 1;
            const lastMatch = matches[matches.length - 1];
            const nextHome = lastMatch.away;
            const nextAway = lastMatch.home;

            setMatches([
                ...matches,
                { id: nextId, home: nextHome, away: nextAway, scoreHome: '', scoreAway: '', isTieBreaker: true }
            ]);
            // Stay in PLAY step
            return;
        }

        if (p1Goals > p2Goals) setWinner(p1);
        else setWinner(p2);

        setStep('RESULT');
    };

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
                    onToggle={(p) => isAdmin ? togglePlayer(p) : alert("Solo el administrador puede seleccionar jugadores.")}
                    onConfirm={startDuel}
                    onCancel={onBack}
                    title="Selecciona 2 Rivales"
                    confirmText={isAdmin ? "Comenzar Duelo" : "Solo Admin"}
                    requiredCount={2}
                    disabled={!isAdmin} // Assuming PlayerSelector has disabled logic, but adding alert above just in case
                />
            </div>
        );
    }

    if (step === 'PLAY') {
        const [p1, p2] = selectedPlayers;

        // Calculate current aggregate for display
        let p1Agg = 0;
        let p2Agg = 0;
        matches.forEach(m => {
            if (m.scoreHome !== '' && m.scoreAway !== '') {
                if (m.home.id === p1.id) {
                    p1Agg += parseInt(m.scoreHome);
                    p2Agg += parseInt(m.scoreAway);
                } else {
                    p1Agg += parseInt(m.scoreAway);
                    p2Agg += parseInt(m.scoreHome);
                }
            }
        });

        return (
            <div style={{
                paddingTop: '6rem',
                paddingBottom: '5rem',
                width: '100%',
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflowY: 'auto'
            }}>

                {/* Header Global Score */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '1rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{p1.name}</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ccff00', fontFamily: 'monospace' }}>{p1Agg} - {p2Agg}</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{p2.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>Marcador Global</div>
                </div>

                <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                    {matches.map((match, index) => (
                        <div key={match.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', width: '100%' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    backgroundColor: match.isTieBreaker ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    color: match.isTieBreaker ? 'rgb(253, 224, 71)' : 'rgba(255, 255, 255, 0.5)'
                                }}>
                                    {match.isTieBreaker ? 'Partido de Desempate' : index === 0 ? 'Partido de Ida' : 'Partido de Vuelta'}
                                </span>
                            </div>
                            <MatchVersus
                                player1={match.home}
                                player2={match.away}
                                score1={match.scoreHome}
                                score2={match.scoreAway}
                                onScoreChange={(field, val) => updateMatchScore(index, field, val)}
                                label="VS"
                                readOnly={!isAdmin} // Pass readOnly
                            />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingBottom: '3rem' }}>
                    <button
                        onClick={() => setStep('SELECT')}
                        style={{
                            padding: '0.75rem 2rem',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#d1d5db',
                            fontWeight: 'bold',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    {isAdmin && (
                        <button
                            onClick={finishDuel}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: '#ccff00',
                                color: 'black',
                                fontWeight: '900',
                                borderRadius: '999px',
                                border: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(204,255,0,0.3)'
                            }}
                        >
                            {matches.length > 2 && matches.every(m => m.scoreHome && m.scoreAway) ? 'Verificar Resultado' : 'Finalizar Duelo'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (step === 'RESULT') {
        const isTie = !winner;
        return (
            <div style={{
                paddingTop: '6rem',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3.75rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 30px rgba(204,255,0,0.5))' }}>🏆</div>
                <h2 style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: '300' }}>Ganador del Duelo</h2>

                {winner && (
                    <div style={{ position: 'relative', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: '4px solid #ccff00', padding: '4px', boxShadow: '0 0 30px rgba(204,255,0,0.5)', background: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                            {winner.image ? (
                                <img src={winner.image} alt={winner.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', fontWeight: '900' }}>{winner.name.charAt(0)}</div>
                            )}
                        </div>
                        <div style={{ marginTop: '-1rem', backgroundColor: '#ccff00', color: 'black', fontWeight: '900', fontSize: '1rem', padding: '0.25rem 1.5rem', borderRadius: '999px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', zIndex: 20 }}>
                            {winner.name}
                        </div>
                    </div>
                )}

                <button
                    onClick={onBack}
                    style={{
                        padding: '1rem 3rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        cursor: 'pointer'
                    }}
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }
};
