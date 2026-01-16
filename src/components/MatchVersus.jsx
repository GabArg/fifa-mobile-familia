
import React from 'react';

const MatchVersus = ({
    player1,
    player2,
    score1,
    score2,
    onScoreChange,
    onFinish,
    isFinished,
    label = "VS",
    readOnly = false // New prop
}) => {
    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '10px 0', opacity: 1 }}>
            {/* Container: Horizontal Row for alignment */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '800px',
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px'
            }}>

                {/* PLAYER 1 (Left) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
                    {/* Name */}
                    <span style={{ color: player1 ? 'white' : 'gray', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '20px', textAlign: 'right', letterSpacing: '0.05em' }}>
                        {player1?.name || 'Jugador 1'}
                    </span>

                    {/* Avatar */}
                    <div className="avatar-strict" style={{ border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        {player1?.avatar || player1?.image ? (
                            <img src={player1.avatar || player1.image} alt="p1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '20px' }}>?</div>
                        )}
                    </div>
                </div>

                {/* CENTER: VS / Scores */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '120px', margin: '0 30px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '8px' }}>{label}</span>

                    {isFinished ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '32px', fontWeight: '900', color: parseInt(score1) > parseInt(score2) ? '#ccff00' : 'white', fontFamily: 'monospace' }}>{score1}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '24px' }}>-</span>
                            <span style={{ fontSize: '32px', fontWeight: '900', color: parseInt(score2) > parseInt(score1) ? '#ccff00' : 'white', fontFamily: 'monospace' }}>{score2}</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="number"
                                value={score1}
                                onChange={(e) => !readOnly && onScoreChange('score1', e.target.value)}
                                disabled={readOnly}
                                style={{
                                    width: '50px', height: '50px',
                                    background: readOnly ? 'transparent' : 'rgba(255,255,255,0.05)',
                                    border: readOnly ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px', textAlign: 'center', color: 'white',
                                    fontSize: '24px', fontWeight: 'bold',
                                    cursor: readOnly ? 'default' : 'text'
                                }}
                                placeholder={readOnly ? "-" : "-"}
                            />
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', fontSize: '20px' }}>:</span>
                            <input
                                type="number"
                                value={score2}
                                onChange={(e) => !readOnly && onScoreChange('score2', e.target.value)}
                                disabled={readOnly}
                                style={{
                                    width: '50px', height: '50px',
                                    background: readOnly ? 'transparent' : 'rgba(255,255,255,0.05)',
                                    border: readOnly ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px', textAlign: 'center', color: 'white',
                                    fontSize: '24px', fontWeight: 'bold',
                                    cursor: readOnly ? 'default' : 'text'
                                }}
                                placeholder={readOnly ? "-" : "-"}
                            />
                        </div>
                    )}

                    {!isFinished && onFinish && !readOnly && (
                        <button
                            onClick={onFinish}
                            className="confirm-btn animate-pulse-subtle"
                            style={{
                                marginTop: '12px',
                                fontSize: '10px',
                                color: 'black',
                                backgroundColor: '#ccff00',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '999px',
                                boxShadow: '0 0 10px rgba(204, 255, 0, 0.4)'
                            }}
                        >
                            CONFIRMAR
                        </button>
                    )}
                </div>

                {/* PLAYER 2 (Right) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '20px' }}>
                    {/* Avatar */}
                    <div className="avatar-strict" style={{ border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        {player2?.avatar || player2?.image ? (
                            <img src={player2.avatar || player2.image} alt="p2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '20px' }}>?</div>
                        )}
                    </div>

                    {/* Name */}
                    <span style={{ color: player2 ? 'white' : 'gray', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '20px', textAlign: 'left', letterSpacing: '0.05em' }}>
                        {player2?.name || 'Jugador 2'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MatchVersus;
