import React from 'react';
import { useAudio } from '../hooks/useAudio';

export const PlayerCard = ({ player, isSelected, onClick, showStats = false }) => {
    const { playClick, playHover } = useAudio();

    const handleClick = () => {
        if (!isSelected) {
            playClick();
        }
        onClick();
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={playHover}
            className={`player-card-container ${isSelected ? 'selected' : ''}`}
        >
            {/* Selection Glow */}
            <div className="player-card-glow"></div>

            {/* Card Content */}
            <div className="player-card-inner">

                {/* Selection Checkmark */}
                {isSelected && (
                    <div className="card-checkmark">✓</div>
                )}

                {/* Rating & Position (Decorative) */}
                <div className="card-top-info">
                    <div className="card-rating">99</div>
                    <div className="card-position">ST</div>
                </div>

                <div className="card-main-content">
                    {/* Avatar Area */}
                    <div className="player-avatar-wrapper">
                        {player.image ? (
                            <img src={player.image} alt={player.name} className="player-avatar-img" />
                        ) : (
                            <div className="player-avatar-placeholder">{player.name.charAt(0)}</div>
                        )}
                    </div>

                    <h3 className="player-name">{player.name}</h3>

                    <div className="player-divider"></div>

                    {showStats ? (
                        <div className="player-stats-grid">
                            <div className="stat-item">
                                <span className="stat-val highlight">{player.won}</span>
                                <span className="stat-label">W</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-val">{player.drawn}</span>
                                <span className="stat-label">D</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-val accent">{player.lost}</span>
                                <span className="stat-label">L</span>
                            </div>
                        </div>
                    ) : (
                        <div className="player-stats-row">
                            {/* Fake Stats for aesthetics */}
                            <div className="stat-col">
                                <span className="stat-val highlight">PAC</span>
                                <span className="stat-sub">99</span>
                            </div>
                            <div className="stat-col">
                                <span className="stat-val highlight">SHO</span>
                                <span className="stat-sub">99</span>
                            </div>
                            <div className="stat-col">
                                <span className="stat-val highlight">PAS</span>
                                <span className="stat-sub">99</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
