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
        <div className="animate-fade-in home-view">
            <h2 className="view-title text-center mb-6">{title}</h2>

            <div className="card-grid mb-8">
                {players.map(p => (
                    <PlayerCard
                        key={p.id}
                        player={p}
                        isSelected={!!selectedPlayers.find(sp => sp.id === p.id)}
                        onClick={() => onToggle(p)}
                    />
                ))}
            </div>

            <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={onCancel}>Volver</Button>
                <Button disabled={!isValid} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </div>
        </div>
    );
};
