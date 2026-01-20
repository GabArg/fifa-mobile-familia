import React from 'react';
import MatchVersus from './MatchVersus';

const TournamentBracket = ({ stages, onUpdateScore, onFinishMatch, onEditMatch, readOnly = false }) => {
    // stages: { semi1, semi2, final, thirdPlace }

    const renderMatchList = (stageKey, title, matches) => {
        return (
            <div className="w-full max-w-xl z-10 flex flex-col gap-4 items-center" style={{ alignItems: 'center' }}>
                <h3 className="text-[#ccff00] font-bold text-sm tracking-widest uppercase mb-2" style={{ textAlign: 'center', width: '100%' }}>{title}</h3>
                {matches.map((match, index) => (
                    <div key={match.id} className="w-full flex flex-col items-center bg-black/20 p-2 rounded-xl border border-white/5 animate-fadeInUp">
                        <div className="text-gray-500 uppercase tracking-widest mb-1 text-[10px]" style={{ textAlign: 'center', width: '100%' }}>{match.label || `Partido ${index + 1}`}</div>
                        <MatchVersus
                            player1={match.player1}
                            player2={match.player2}
                            score1={match.score1}
                            score2={match.score2}
                            isFinished={match.isFinished}
                            onScoreChange={(field, val) => onUpdateScore(stageKey, index, field, val)}
                            onFinish={() => onFinishMatch(stageKey, index)}
                            onEdit={() => onEditMatch && onEditMatch(stageKey, index)}
                            label="VS"
                            readOnly={readOnly}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col items-center gap-12 overflow-x-auto p-4 md:p-8">

            {/* Etapa Semifinales (Doble Partido) */}
            <div className="flex flex-col gap-12 w-full justify-center items-center relative">

                {/* SEMIFINAL A: P1 vs P2 */}
                {renderMatchList('semi1', 'Semifinal A', stages.semi1.matches)}

                {/* SEMIFINAL B: P3 vs P4 */}
                {renderMatchList('semi2', 'Semifinal B', stages.semi2.matches)}
            </div>

            {/* FINALS AREA */}
            <div className="w-full flex flex-col lg:flex-row gap-12 justify-center mt-8">

                {/* Gran Final */}
                {stages.final.matches.length > 0 && (
                    <div className="flex-1">
                        <div className="relative w-full flex flex-col items-center">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#ccff00]/20 to-transparent blur-3xl opacity-30 pointer-events-none"></div>
                            <div className="relative z-10 w-full flex justify-center">
                                {renderMatchList('final', 'Gran Final', stages.final.matches)}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3er Puesto */}
                {stages.thirdPlace.matches.length > 0 && (
                    <div className="flex-1">
                        <div className="w-full flex justify-center opacity-80">
                            {renderMatchList('thirdPlace', '3er y 4to Puesto', stages.thirdPlace.matches)}
                        </div>
                    </div>
                )}
            </div>

            {/* Waiting State if Finals not ready */}
            {stages.final.matches.length === 0 && (
                <div className="w-full h-24 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 border-dashed mt-8">
                    <span className="text-gray-500 font-bold text-lg animate-pulse">Esperando Finalistas...</span>
                </div>
            )}

        </div>
    );
};

export default TournamentBracket;
