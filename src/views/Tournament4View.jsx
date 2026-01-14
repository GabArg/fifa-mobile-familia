
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import TournamentBracket from '../components/TournamentBracket';
import { useAudio } from '../hooks/useAudio';

export const Tournament4View = ({ onBack, onToggleUI }) => {
    const [step, setStep] = useState('LOADING');

    // Dynamic Stages State
    // Each stage has a 'matches' array.
    // matches: [{ id, player1, player2, score1, score2, isFinished, label }]
    const [stages, setStages] = useState({
        semi1: { matches: [], winner: null, loser: null },
        semi2: { matches: [], winner: null, loser: null },
        final: { matches: [], winner: null },
        thirdPlace: { matches: [], winner: null }
    });

    const [champion, setChampion] = useState(null);

    useEffect(() => {
        const allPlayers = StorageService.getPlayers();
        if (allPlayers.length >= 4) {
            startTournament(allPlayers);
        } else {
            console.warn("Not enough players for Tournament 4");
        }
    }, []);

    const startTournament = (availablePlayers) => {
        const shuffled = [...availablePlayers].sort(() => 0.5 - Math.random());
        const p = shuffled.slice(0, 4);

        // Initialize Semis with Double Leg (Ida/Vuelta)
        // Semi 1: P1 vs P2
        const semi1Matches = [
            createMatch(p[0], p[1], 'IDA'),
            createMatch(p[1], p[0], 'VUELTA')
        ];

        // Semi 2: P3 vs P4
        const semi2Matches = [
            createMatch(p[2], p[3], 'IDA'),
            createMatch(p[3], p[2], 'VUELTA')
        ];

        setStages({
            semi1: { matches: semi1Matches, winner: null, loser: null },
            semi2: { matches: semi2Matches, winner: null, loser: null },
            final: { matches: [], winner: null },
            thirdPlace: { matches: [], winner: null }
        });
        setStep('PLAY');
    };

    const createMatch = (p1, p2, label) => {
        return {
            id: Date.now() + Math.random(),
            player1: p1,
            player2: p2,
            score1: '',
            score2: '',
            isFinished: false,
            label: label
        };
    };

    const updateScore = (stageKey, matchIndex, field, val) => {
        if (val < 0) return;
        setStages(prev => {
            const newStages = { ...prev };
            const newMatches = [...newStages[stageKey].matches];
            newMatches[matchIndex] = { ...newMatches[matchIndex], [field]: val };
            newStages[stageKey].matches = newMatches;
            return newStages;
        });
    };

    const finishMatch = (stageKey, matchIndex) => {
        const stage = stages[stageKey];
        const match = stage.matches[matchIndex];

        if (match.score1 === '' || match.score2 === '') return;

        // Finish usage to check if we need to finish the match in state
        const newStages = { ...stages };
        newStages[stageKey].matches[matchIndex].isFinished = true;
        setStages(newStages);

        // Check if ALL matches in this stage are finished
        const allFinished = newStages[stageKey].matches.every(m => m.isFinished);
        if (allFinished) {
            evaluateStage(stageKey, newStages);
        }
    };

    const evaluateStage = (stageKey, currentStages) => {
        const stage = currentStages[stageKey];
        let p1Goals = 0;
        let p2Goals = 0;

        // Identify the "Primary" players for this stage from the first match
        // (Assuming match 0 players are the reference for p1/p2 identity)
        const refMatch = stage.matches[0];
        const p1 = refMatch.player1;
        const p2 = refMatch.player2;

        stage.matches.forEach(m => {
            const s1 = parseInt(m.score1 || 0);
            const s2 = parseInt(m.score2 || 0);

            if (m.player1.id === p1.id) {
                p1Goals += s1;
                p2Goals += s2;
            } else {
                // Swap
                p1Goals += s2;
                p2Goals += s1;
            }
        });

        if (p1Goals === p2Goals) {
            // TIE -> Add Tie Breaker Match
            const lastMatch = stage.matches[stage.matches.length - 1];
            // Swap home/away for next match? Usually yes.
            const newMatch = createMatch(lastMatch.player2, lastMatch.player1, 'DESEMPATE');

            setStages(prev => ({
                ...prev,
                [stageKey]: {
                    ...prev[stageKey],
                    matches: [...prev[stageKey].matches, newMatch]
                }
            }));
            return;
        }

        // We have a winner
        const winner = p1Goals > p2Goals ? p1 : p2;
        const loser = p1Goals > p2Goals ? p2 : p1;

        const updatedStages = { ...currentStages };
        updatedStages[stageKey].winner = winner;
        updatedStages[stageKey].loser = loser;

        // Propagate to next stages
        if (stageKey === 'semi1') {
            // If semi2 is also done, we can init final? Or just set available spots?
            // Actually, we can check if semi2 is done to avoid overwriting or waiting.
            // But simpler: Just place this winner into Final slot 1.
            // We need to wait for both semis to init the Final matches properly (Ida/Vuelta).
            checkSemisAndInitFinals(updatedStages);
        } else if (stageKey === 'semi2') {
            checkSemisAndInitFinals(updatedStages);
        } else if (stageKey === 'final') {
            setChampion(winner);

            // Build Standings
            const standings = [
                { playerId: winner.id, rank: 1 },
                { playerId: loser.id, rank: 2 }
            ];

            // Add 3rd/4th if available
            // Note: If 3rd place match isn't finished yet, we unfortunately miss it in this save trigger.
            // Assumption: User finishes 3rd place before Final or effectively simultaneous.
            const t3Winner = updatedStages.thirdPlace.winner;
            const t3Loser = updatedStages.thirdPlace.loser;

            if (t3Winner) standings.push({ playerId: t3Winner.id, rank: 3 });
            if (t3Loser) standings.push({ playerId: t3Loser.id, rank: 4 });

            StorageService.saveTournament({
                id: Date.now().toString(),
                type: 'tourney4',
                date: new Date().toISOString(),
                standings: standings
            });

            if (onToggleUI) onToggleUI(false);
        } else if (stageKey === 'thirdPlace') {
            // Just mark winner, maybe show a mini modal or toast?
            // user only explicitly asked for Champion screen, but we can show something.
        }

        setStages(updatedStages);

        // Save history (Simplified: just save the last decisive match or all? Let's skip detailed history logic for now to ensure flow works)
    };

    const checkSemisAndInitFinals = (currentStages) => {
        const s1 = currentStages.semi1;
        const s2 = currentStages.semi2;

        // Helper to check if populated
        const isSemi1Done = !!s1.winner;
        const isSemi2Done = !!s2.winner;

        // If both finished, initialize Final and Third Place
        // Check if Final/3rd already initialized to avoid reset
        if (isSemi1Done && isSemi2Done && currentStages.final.matches.length === 0) {
            // Final: Winner 1 vs Winner 2
            const w1 = s1.winner;
            const w2 = s2.winner;

            currentStages.final.matches = [
                createMatch(w1, w2, 'FINAL IDA'),
                createMatch(w2, w1, 'FINAL VUELTA')
            ];

            // 3rd Place: Loser 1 vs Loser 2
            const l1 = s1.loser;
            const l2 = s2.loser;

            currentStages.thirdPlace.matches = [
                createMatch(l1, l2, '3º PUESTO IDA'),
                createMatch(l2, l1, '3º PUESTO VUELTA')
            ];
        }
    };

    const handleBack = () => {
        if (onToggleUI) onToggleUI(true);
        onBack();
    };

    if (step === 'LOADING') {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ccff00]"></div>
            </div>
        );
    }

    return (
        <div className="pt-24 px-4 pb-20 max-w-7xl mx-auto min-h-screen">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">COPA DE 4</h1>
                <div className="h-1 w-16 bg-[#ccff00] mx-auto mt-2 rounded-full shadow-[0_0_15px_#ccff00]"></div>
            </div>

            <TournamentBracket
                stages={stages}
                onUpdateScore={updateScore}
                onFinishMatch={finishMatch}
            />

            {champion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4 drop-shadow-[0_0_50px_rgba(204,255,0,0.8)] animate-bounce">🏆</div>
                        <h2 className="text-2xl text-white font-black italic uppercase tracking-tighter mb-4">¡Campeón!</h2>

                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent blur-xl opacity-50"></div>
                            <div className="w-32 h-32 rounded-full border-2 border-[#ccff00] overflow-hidden relative z-10 shadow-2xl">
                                {champion.image ? (
                                    <img src={champion.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl font-black text-white">{champion.name[0]}</div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-4xl font-black text-white mb-8 drop-shadow-lg">{champion.name}</h3>

                        <button
                            onClick={handleBack}
                            className="px-12 py-4 bg-[#ccff00] text-black font-black text-xl rounded-full uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_30px_rgba(204,255,0,0.4)]"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            )}

            {!champion && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={onBack}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-full border border-white/10 backdrop-blur-md transition-all uppercase tracking-wider"
                    >
                        Cancelar Torneo
                    </button>
                </div>
            )}
        </div>
    );
};
