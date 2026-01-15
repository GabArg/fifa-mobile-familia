import React from 'react';
import { PlayerCard } from './PlayerCard';
import { Button } from './Button';

export const PlayerSelector = ({
    players,
    selectedPlayers,
    onToggle,
    onConfirm,
    onCancel,
    title = "Selecciona Jugadores",
    confirmText = "Comenzar",
    requiredCount = 0
}) => {

    const isValid = requiredCount > 0 ? selectedPlayers.length === requiredCount : selectedPlayers.length > 0;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '1rem' }}>
            <h2 className="view-title" style={{ textAlign: 'center', marginBottom: '1.5rem', flexShrink: 0, textShadow: '0 4px 6px rgba(0,0,0,0.5)' }}>{title}</h2>

            <div className="card-grid" style={{ marginBottom: '1rem', flex: 1, overflowY: 'auto', minHeight: 0, paddingTop: '0.5rem', paddingBottom: '1rem' }}>
                {players.map(p => (
                    <PlayerCard
                        key={p.id}
                        player={p}
                        isSelected={!!selectedPlayers.find(sp => sp.id === p.id)}
                        onClick={() => onToggle(p)}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem 0', flexShrink: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', paddingTop: '1.5rem' }}>
                <Button variant="secondary" onClick={onCancel} style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>Volver</Button>
                <Button disabled={!isValid} onClick={onConfirm} style={{ boxShadow: '0 0 10px 2px rgba(50, 224, 196, 0.5)' }}>
                    {confirmText}
                </Button>
            </div>
        </div>
    );
};
