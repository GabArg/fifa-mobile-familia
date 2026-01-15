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
        <div className="animate-fade-in flex flex-col h-full w-full p-4">
            <h2 className="view-title text-center mb-6 flex-shrink-0 drop-shadow-md">{title}</h2>

            <div className="card-grid mb-4 flex-1 overflow-y-auto min-h-0 pt-2 pb-4 px-2">
                <div className="flex flex-wrap justify-center gap-4">
                    {players.map(p => (
                        <PlayerCard
                            key={p.id}
                            player={p}
                            isSelected={!!selectedPlayers.find(sp => sp.id === p.id)}
                            onClick={() => onToggle(p)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex justify-center gap-4 py-4 flex-shrink-0 bg-gradient-to-t from-black/80 to-transparent pt-6">
                <Button variant="secondary" onClick={onCancel} className="shadow-lg border border-white/20">Volver</Button>
                <Button disabled={!isValid} onClick={onConfirm} className="shadow-lg box-shadow-neon">
                    {confirmText}
                </Button>
            </div>
        </div>
    );
};
