import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PlayerCard } from '../components/PlayerCard';

export const StatsView = ({ onBack, isAdmin, handleGoogleLogin, handleLogout, user }) => {
    const [tab, setTab] = useState('GENERAL'); // GENERAL, TOURNEY, H2H, MATCHES
    const [players, setPlayers] = useState([]);

    // ... (rest of state)

    // State for debugging/versioning
    const APP_VERSION = "v2.1 (Debug)";

    // Data State
    const [stats, setStats] = useState([]);
    const [matches, setMatches] = useState([]);

    // Filters
    const [tourneyFilter, setTourneyFilter] = useState('ALL'); // ALL, duel, tourney3, tourney4
    const [isPodiumMode, setIsPodiumMode] = useState(false);

    // H2H State
    const [h2hP1, setH2hP1] = useState(null);
    const [h2hP2, setH2hP2] = useState(null);
    const [h2hStats, setH2hStats] = useState(null);
    const [h2hFilter, setH2hFilter] = useState('ALL'); // New filter state

    // Editing State
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [editScores, setEditScores] = useState({ s1: '', s2: '' });

    useEffect(() => {
        const allPlayers = StorageService.getPlayers();
        setPlayers(allPlayers);

        // Load initial stats
        loadStats();
        setMatches(StorageService.getMatches().sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, []);

    useEffect(() => {
        if (tab === 'TOURNEY') {
            if (tourneyFilter === 'tourney3' || tourneyFilter === 'tourney4') {
                setIsPodiumMode(true);
                setStats(StorageService.getTournamentStats({ type: tourneyFilter }));
            } else {
                setIsPodiumMode(false);
                loadStats(tourneyFilter === 'ALL' ? {} : { type: tourneyFilter });
            }
        } else if (tab === 'GENERAL') {
            setIsPodiumMode(false);
            loadStats({});
        }
    }, [tab, tourneyFilter]);

    useEffect(() => {
        if (h2hP1 && h2hP2) {
            setH2hStats(StorageService.getHeadToHead(h2hP1.id, h2hP2.id, { type: h2hFilter }));
        } else {
            setH2hStats(null);
        }
    }, [h2hP1, h2hP2, h2hFilter]); // Added h2hFilter dependency

    const loadStats = (filter = {}) => {
        setStats(StorageService.getStats(filter));
    };

    const handleReset = async () => {
        if (!isAdmin) {
            alert("❌ ERROR: No estás detectado como Administrador.\n\nInicia sesión en la pestaña DATOS (botón verde) para poder borrar la nube.");
            return;
        }

        if (confirm('⚠️ PELIGRO NUCLEAR ⚠️\n\n¿Estás 100% SEGURO de borrar TODA la base de datos de la Nube y el Local?\n\nEsto eliminará permanentemente todos los partidos y torneos.')) {
            if (confirm('¿Última oportunidad? Escribe "SI" (mentalmente) y dale Aceptar.')) {
                try {
                    const { CloudService } = await import('../services/CloudService');

                    // Show loading state or at least prevent navigation
                    document.body.style.cursor = 'wait';

                    await CloudService.deleteAllData();

                    alert('✅ BASE DE DATOS BORRADA EN LA NUBE.\n\nLa aplicación se recargará ahora como nueva.');

                    StorageService.resetStats();
                    window.location.reload();
                } catch (e) {
                    alert('❌ Error borrando nube: ' + e.message);
                    document.body.style.cursor = 'default';
                }
            }
        }
    };

    const handleExport = () => {
        const json = StorageService.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fifa_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = StorageService.importData(e.target.result);
            if (success) {
                alert('¡Backup restaurado con éxito!');
                window.location.reload();
            } else {
                alert('Error al restaurar. El archivo parece inválido.');
            }
        };
        reader.readAsText(file);
    };

    const renderTable = (data) => (
        <div className="glass-panel table-container">
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
                    {data.map((p, i) => (
                        <tr key={p.id} className="table-row">
                            <td className={`p-3 text-center font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/50'}`}>{i + 1}</td>
                            <td className="p-3 font-bold player-cell">
                                <div className="player-avatar-small">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} />
                                    ) : (
                                        <span>{p.name.charAt(0)}</span>
                                    )}
                                </div>
                                {p.name}
                            </td>
                            <td className="p-3 text-center font-bold text-xl text-[--primary]">{p.points}</td>
                            <td className="p-3 text-center text-white/70">{p.matchesPlayed}</td>
                            <td className="p-3 text-center text-green-400/80">{p.won}</td>
                            <td className="p-3 text-center text-yellow-400/80">{p.drawn}</td>
                            <td className="p-3 text-center text-red-400/80">{p.lost}</td>
                            <td className="p-3 text-center text-white/60">{p.gf}</td>
                            <td className="p-3 text-center text-white/60">{p.ga}</td>
                            <td className="p-3 text-center text-white/40 font-mono text-sm">{p.gf - p.ga > 0 ? `+${p.gf - p.ga}` : p.gf - p.ga}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPodiumTable = (data) => (
        <div className="glass-panel table-container">
            <table className="data-table">
                <thead>
                    <tr className="table-head-row">
                        <th className="p-3 text-center w-12">Pos</th>
                        <th className="p-3">Jugador</th>
                        <th className="p-3 text-center">Torneos</th>
                        <th className="p-3 text-center text-2xl" title="Campeón">👑</th>
                        <th className="p-3 text-center text-xl" title="Subcampeón">🥈</th>
                        <th className="p-3 text-center text-xl" title="Tercero">🥉</th>
                        {tourneyFilter === 'tourney4' && <th className="p-3 text-center text-white/50">4º</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((p, i) => (
                        <tr key={p.id} className="table-row">
                            <td className={`p-3 text-center font-bold ${i === 0 ? 'text-[--primary]' : 'text-white/50'}`}>{i + 1}</td>
                            <td className="p-3 font-bold player-cell">
                                <div className="player-avatar-small">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} />
                                    ) : (
                                        <span>{p.name.charAt(0)}</span>
                                    )}
                                </div>
                                {p.name}
                            </td>
                            <td className="p-3 text-center text-white/70">{p.tournamentsPlayed || 0}</td>
                            <td className="p-3 text-center font-black text-xl text-yellow-400">{p.first || 0}</td>
                            <td className="p-3 text-center font-bold text-gray-300">{p.second || 0}</td>
                            <td className="p-3 text-center font-bold text-amber-700">{p.third || 0}</td>
                            {tourneyFilter === 'tourney4' && <td className="p-3 text-center text-white/30">{p.fourth || 0}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="stats-view animate-fade-in">
            <div className="view-header-row mb-6">
                <Button variant="secondary" className="btn-small" onClick={onBack}>
                    <span className="flex items-center gap-1"><span className="text-xl">«</span> Volver</span>
                </Button>

                <div className="stats-tabs flex-1 mx-4 overflow-x-auto">
                    <button
                        className={`stats-tab-item ${tab === 'GENERAL' ? 'active' : ''}`}
                        onClick={() => setTab('GENERAL')}
                    >
                        General
                    </button>
                    <button
                        className={`stats-tab-item ${tab === 'TOURNEY' ? 'active' : ''}`}
                        onClick={() => setTab('TOURNEY')}
                    >
                        Torneos
                    </button>
                    <button
                        className={`stats-tab-item ${tab === 'H2H' ? 'active' : ''}`}
                        onClick={() => setTab('H2H')}
                    >
                        Historial
                    </button>
                    <button
                        className={`stats-tab-item ${tab === 'MATCHES' ? 'active' : ''}`}
                        onClick={() => setTab('MATCHES')}
                    >
                        Partidos
                    </button>
                    <button
                        className={`stats-tab-item bg-white/5 ${tab === 'DATA' ? 'active' : ''}`}
                        onClick={() => setTab('DATA')}
                    >
                        Datos
                    </button>
                </div>
            </div>

            <Card className="flex-1 w-full overflow-hidden flex flex-col p-4">
                {/* GENERAL TAB */}
                {tab === 'GENERAL' && (
                    <>
                        <h2 className="view-title mb-4">Tabla General</h2>
                        {renderTable(stats)}
                    </>
                )}

                {/* TOURNAMENT TAB */}
                {tab === 'TOURNEY' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <Button onClick={onBack} className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-sm">
                                    « Volver
                                </Button>
                                <span className="text-[10px] text-white/30 ml-2 font-mono">{APP_VERSION}</span>
                            </div>
                            <select
                                className="bg-black text-white border border-white/20 p-2 rounded"
                                value={tourneyFilter}
                                onChange={(e) => setTourneyFilter(e.target.value)}
                            >
                                <option value="ALL">Todos</option>
                                <option value="duel">Duelos 1v1</option>
                                <option value="tourney3">Torneo de 3</option>
                                <option value="tourney4">Copa de 4</option>
                            </select>
                        </div>
                        {isPodiumMode ? renderPodiumTable(stats) : renderTable(stats)}
                    </>
                )}

                {/* HISTORY (H2H) TAB */}
                {tab === 'H2H' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="view-title mb-0">Historial VS</h2>

                            {/* NEW: Filter Control */}
                            <select
                                className="bg-black text-white border border-white/20 p-1 rounded text-sm"
                                value={h2hFilter}
                                onChange={(e) => setH2hFilter(e.target.value)}
                            >
                                <option value="ALL">Todo</option>
                                <option value="duel">Duelos</option>
                                <option value="tourney3">Liga 3</option>
                                <option value="tourney4">Copa 4</option>
                            </select>
                        </div>

                        <div className="vs-container flex justify-between items-center gap-4 mb-6">
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-center text-white/50 text-xs uppercase tracking-widest">Jugador 1</label>
                                <select className="bg-black/50 border border-[--primary] p-2 rounded text-white text-center font-bold" onChange={e => setH2hP1(players.find(p => p.id === e.target.value))}>
                                    <option value="">Seleccionar</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold italic text-white/20">VS</span>
                            </div>

                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-center text-white/50 text-xs uppercase tracking-widest">Jugador 2</label>
                                <select className="bg-black/50 border border-[--accent] p-2 rounded text-white text-center font-bold" onChange={e => setH2hP2(players.find(p => p.id === e.target.value))}>
                                    <option value="">Seleccionar</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {h2hStats && (
                            <div className="animate-fade-in flex flex-col items-center flex-1 overflow-hidden">
                                {/* H2H Summary - FLEX ROW FORCE */}
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', width: '100%', maxWidth: '800px', marginBottom: '32px', gap: '16px' }}>
                                    {/* P1 Stats */}
                                    <div className="bg-[--primary] text-black rounded-lg p-3 relative group overflow-hidden shadow-lg" style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                        <div className="text-5xl font-black relative z-10 mb-2">{h2hStats.p1Wins}</div>
                                        <div className="w-full flex flex-col items-center border-t border-black/10 pt-2 relative z-10 gap-1">
                                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 block mb-1">Victorias</span>
                                            <span className="text-xs font-black uppercase truncate w-full text-center block">{h2hP1.name}</span>
                                        </div>
                                    </div>

                                    {/* Draws */}
                                    <div className="bg-white/10 text-white rounded-lg p-3 border border-white/5" style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <div className="text-3xl font-bold mb-2">{h2hStats.draws}</div>
                                        <div className="w-full flex flex-col items-center border-t border-white/10 pt-2">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-1">Empates</span>
                                            <span className="text-xs font-black uppercase opacity-0 block h-4">{'\u00A0'}</span>
                                        </div>
                                    </div>

                                    {/* P2 Stats */}
                                    <div className="bg-white/20 text-white rounded-lg p-3 relative group overflow-hidden" style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div className="text-5xl font-black mb-2">{h2hStats.p2Wins}</div>
                                        <div className="w-full flex flex-col items-center border-t border-white/10 pt-2 gap-1">
                                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 block mb-1">Victorias</span>
                                            <span className="text-xs font-black uppercase truncate w-full text-center block">{h2hP2.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>

                                {/* Match List */}
                                <div className="w-full overflow-y-auto overflow-x-auto flex-1 pr-1 relative">
                                    <h3 className="sticky top-0 z-20 bg-[#0f0f13] text-center mb-2 pt-2 pb-2 text-[--primary] uppercase tracking-[0.2em] text-xs font-bold w-full min-w-[600px]">Historial de Partidos</h3>

                                    {/* H2H Headers */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        height: '24px',
                                        width: '100%',
                                        minWidth: '600px',
                                        padding: '0 12px',
                                        marginBottom: '4px',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        position: 'sticky',
                                        top: '32px', // Below the h3 title
                                        zIndex: 20,
                                        backgroundColor: '#0f0f13'
                                    }} className="flex-shrink-0">
                                        <div style={{ width: '50px', textAlign: 'center' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Fecha</div>
                                        <div style={{ flex: 1, textAlign: 'right' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Local</div>
                                        <div style={{ width: '88px', textAlign: 'center' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Res</div>
                                        <div style={{ flex: 1, textAlign: 'left' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Visita</div>
                                        <div style={{ width: '80px', textAlign: 'center' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Torneo</div>
                                    </div>

                                    <div className="flex flex-col gap-1 pb-2">
                                        {h2hStats.matches.map(m => {
                                            const p1Score = m.scores[h2hP1.id];
                                            const p2Score = m.scores[h2hP2.id];
                                            const date = new Date(m.date).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
                                            const typeLabel = m.type === 'duel' ? 'DUELO' : m.type === 'tourney4' ? 'COPA 4' : m.type === 'tournament3' ? 'LIGA 3' : 'VS';

                                            const p1Won = p1Score > p2Score;
                                            const p2Won = p2Score > p1Score;

                                            return (
                                                <div key={m.id} style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    height: '56px',
                                                    width: '100%',
                                                    minWidth: '600px',
                                                    whiteSpace: 'nowrap',
                                                    gap: '8px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    padding: '0 12px',
                                                    marginBottom: '2px', // Reduce margin in this tighter view? Kept distinct though.
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                    backdropFilter: 'blur(4px)'
                                                }} className="group hover:bg-white/10 transition-all">

                                                    {/* 1. DATE */}
                                                    <div style={{ width: '50px', flexShrink: 0, textAlign: 'center' }} className="text-white/50 font-mono text-xs">{date}</div>

                                                    {/* 2. PLAYER 1 */}
                                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }} className={`truncate ${p1Won ? 'text-white' : 'text-gray-500'}`}>{h2hP1.name}</span>
                                                    </div>

                                                    {/* 3. SCORE 1 */}
                                                    <div style={{ width: '30px', flexShrink: 0, textAlign: 'center', fontWeight: '900', fontSize: '18px' }} className={p1Won ? 'text-[#ccff00]' : 'text-white'}>{p1Score}</div>

                                                    {/* 4. VS */}
                                                    <div style={{ width: '20px', flexShrink: 0, textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>VS</div>

                                                    {/* 5. SCORE 2 */}
                                                    <div style={{ width: '30px', flexShrink: 0, textAlign: 'center', fontWeight: '900', fontSize: '18px' }} className={p2Won ? 'text-[#ccff00]' : 'text-white'}>{p2Score}</div>

                                                    {/* 6. PLAYER 2 */}
                                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }} className={`truncate ${p2Won ? 'text-white' : 'text-gray-500'}`}>{h2hP2.name}</span>
                                                    </div>

                                                    {/* 7. TOURNAMENT */}
                                                    <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }} className="text-[10px] uppercase text-[--primary] tracking-wider font-bold">
                                                        {typeLabel}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MATCHES LOG TAB */}
                {tab === 'MATCHES' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-shrink-0 flex justify-between items-end mb-4 px-2">
                            <h2 className="view-title mb-0 text-white drop-shadow-md" style={{ fontSize: '2rem' }}>Historial de Partidos</h2>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-white/50 uppercase tracking-widest font-bold">{matches.length} Registros</span>
                                <span className={`text-[10px] font-bold px-1 rounded ${isAdmin ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                    ADMIN: {isAdmin ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>

                        {/* Column Headers (Fixed) */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            height: '30px',
                            width: '100%',
                            minWidth: '600px',
                            padding: '0 12px',
                            marginBottom: '4px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }} className="flex-shrink-0">
                            <div style={{ width: '50px', textAlign: 'center' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Fecha</div>
                            <div style={{ flex: 1, textAlign: 'right' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Local</div>
                            <div style={{ width: '88px', textAlign: 'center' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Res</div>
                            <div style={{ flex: 1, textAlign: 'left' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Visita</div>
                            <div style={{ width: '80px', textAlign: 'center' }} className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Torneo</div>
                        </div>

                        <div className="overflow-y-auto overflow-x-auto flex-1 pr-2 space-y-1 relative">
                            {matches.map(m => {
                                const p1 = players.find(p => p.id === m.players[0]);
                                const p2 = players.find(p => p.id === m.players[1]);
                                if (!p1 || !p2) return null;

                                const s1 = m.scores[p1.id];
                                const s2 = m.scores[p2.id];
                                const date = new Date(m.date).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
                                const typeLabel = m.type === 'duel' ? 'DUELO' : m.type === 'tourney4' ? 'COPA 4' : m.type === 'tournament3' ? 'LIGA 3' : 'VS';

                                const p1Won = s1 > s2;
                                const p2Won = s2 > s1;

                                return (
                                    <div key={m.id} style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        height: '56px',
                                        width: '100%',
                                        minWidth: '600px',
                                        whiteSpace: 'nowrap',
                                        gap: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '0 12px',
                                        marginBottom: '6px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(4px)'
                                    }} className="group hover:bg-white/10 transition-all">

                                        {/* 1. DATE */}
                                        <div style={{ width: '50px', flexShrink: 0, textAlign: 'center' }} className="text-white/50 font-mono text-xs">{date}</div>

                                        {/* 2. PLAYER 1 */}
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }} className={`truncate ${p1Won ? 'text-white' : 'text-gray-500'}`}>{p1.name}</span>
                                        </div>

                                        {/* 3. SCORE 1 */}
                                        {editingMatchId === m.id ? (
                                            <input
                                                type="number"
                                                value={editScores.s1}
                                                onChange={e => setEditScores({ ...editScores, s1: e.target.value })}
                                                className="w-[30px] bg-black border border-white/50 text-center text-white font-bold"
                                            />
                                        ) : (
                                            <div style={{ width: '30px', flexShrink: 0, textAlign: 'center', fontWeight: '900', fontSize: '18px' }} className={p1Won ? 'text-[#ccff00]' : 'text-white'}>{s1}</div>
                                        )}

                                        {/* 4. VS */}
                                        <div style={{ width: '20px', flexShrink: 0, textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>VS</div>

                                        {/* 5. SCORE 2 */}
                                        {editingMatchId === m.id ? (
                                            <input
                                                type="number"
                                                value={editScores.s2}
                                                onChange={e => setEditScores({ ...editScores, s2: e.target.value })}
                                                className="w-[30px] bg-black border border-white/50 text-center text-white font-bold"
                                            />
                                        ) : (
                                            <div style={{ width: '30px', flexShrink: 0, textAlign: 'center', fontWeight: '900', fontSize: '18px' }} className={p2Won ? 'text-[#ccff00]' : 'text-white'}>{s2}</div>
                                        )}

                                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }} className={`truncate ${p2Won ? 'text-white' : 'text-gray-500'}`}>{p2.name}</span>

                                        {/* 7. ACTIONS (Admin Only) */}
                                        {isAdmin ? (
                                            <div style={{ width: '80px', flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                                                {editingMatchId === m.id ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={async () => {
                                                                const s1 = parseInt(editScores.s1);
                                                                const s2 = parseInt(editScores.s2);
                                                                if (isNaN(s1) || isNaN(s2)) return;

                                                                const updated = { ...m, scores: { [p1.id]: s1, [p2.id]: s2 } };
                                                                StorageService.updateMatch(updated);
                                                                loadStats({});
                                                                setMatches(StorageService.getMatches().sort((a, b) => new Date(b.date) - new Date(a.date)));
                                                                setEditingMatchId(null);
                                                            }}
                                                            className="bg-green-500 text-black px-2 rounded text-xs font-bold hover:bg-green-400"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMatchId(null)}
                                                            className="bg-red-500 text-white px-2 rounded text-xs font-bold hover:bg-red-400"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1 items-center justify-center bg-black/40 rounded px-1 border border-white/10">
                                                        <button
                                                            onClick={() => {
                                                                setEditingMatchId(m.id);
                                                                setEditScores({ s1: m.scores[p1.id], s2: m.scores[p2.id] });
                                                            }}
                                                            className="text-yellow-400 hover:text-yellow-200 transition-colors p-1"
                                                            title="Editar Resultado"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('¿Borrar este partido?')) {
                                                                    StorageService.deleteMatch(m.id);
                                                                    loadStats({});
                                                                    setMatches(StorageService.getMatches().sort((a, b) => new Date(b.date) - new Date(a.date)));
                                                                }
                                                            }}
                                                            className="text-red-500 hover:text-red-300 transition-colors p-1"
                                                            title="Borrar Partido"
                                                            style={{ fontSize: '1.2em' }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* DEBUG: Show placeholder if not admin, to see if column exists */
                                            <div style={{ width: '1px' }}></div>
                                        )}

                                        {/* 8. TOURNAMENT LABEL (Hidden if editing? No, keep it) */}
                                        {
                                            !editingMatchId && (
                                                <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }} className="text-[10px] uppercase text-[--primary] tracking-wider font-bold">
                                                    {typeLabel}
                                                </div>
                                            )
                                        }
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
                }

                {/* DATA MANAGEMENT TAB */}
                {
                    tab === 'DATA' && (
                        <div className="flex flex-col h-full gap-6 overflow-y-auto">
                            <div className="mb-4">
                                <h2 className="view-title mb-2">Gestión de Datos</h2>
                                <p className="text-white/50 text-sm">
                                    Aquí puedes guardar una copia de seguridad de toda la información o restaurarla en otro dispositivo.
                                </p>
                            </div>

                            {/* CLOUD & ADMIN SECTION */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                                <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="text-2xl">☁️</span> Nube & Admin
                                </h3>

                                {isAdmin ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-green-500/20 text-green-400 p-2 rounded text-center font-bold text-sm border border-green-500/50">
                                            ✅ MODO ADMIN ACTIVO
                                        </div>
                                        <p className="text-white/50 text-xs text-center mb-2">Sesión: {user?.email}</p>
                                        <Button onClick={handleLogout} className="w-full bg-red-900/50 hover:bg-red-900 text-xs py-1 mb-4 border border-red-500/30">
                                            Cerrar Sesión
                                        </Button>

                                        <div>
                                            <h4 className="text-white font-bold mb-1">Diagnóstico</h4>
                                            <Button onClick={async () => {
                                                try {
                                                    const { CloudService } = await import('../services/CloudService');
                                                    alert("🔍 Iniciando diagnóstico...\n\nSi esto se queda cargando, hay problemas de conexión/permisos.");
                                                    const report = await CloudService.runDiagnostics();
                                                    alert(`📊 REPORTE DE ESTADO:\n\n🌍 NUBE:\n- Partidos: ${report.cloudMatches}\n- Torneos: ${report.cloudTournaments}\n\n📱 LOCAL:\n- Partidos: ${StorageService.getMatches().length}\n- Torneos: ${StorageService.getTournaments().length}\n\n${report.cloudMatches > 0 ? "⚠️ HAY DATOS EN LA NUBE QUE NO SE BORRARON" : "✅ Nube limpia"}`);
                                                } catch (e) {
                                                    alert("❌ Error Diagnóstico: " + e.message);
                                                }
                                            }} className="w-full bg-yellow-600 hover:bg-yellow-500 mb-2">
                                                🔍 Test Conexión Nube
                                            </Button>
                                        </div>

                                        <div>
                                            <h4 className="text-white font-bold mb-1">Sincronización Inicial</h4>
                                            <Button onClick={async () => {
                                                if (confirm("¿Subir todos los datos locales a la nube?")) {
                                                    const { CloudService } = await import('../services/CloudService');
                                                    await CloudService.uploadLocalData();
                                                    alert("¡Datos subidos!");
                                                }
                                            }} className="w-full btn-primary bg-blue-600 hover:bg-blue-500">
                                                🚀 Subir Datos Locales
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-white/50 text-xs">Inicia sesión para gestionar la nube.</p>

                                        <Button onClick={handleGoogleLogin} className="w-full bg-white text-black hover:bg-gray-200">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xl">🇬</span>
                                                <span>Iniciar con Google</span>
                                            </div>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Backup Section */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                <h3 className="text-[--primary] font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="text-2xl">💾</span> Copia de Seguridad
                                </h3>

                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Exportar Datos</h4>
                                        <p className="text-white/50 text-xs mb-3">Descarga un archivo con todo tu historial.</p>
                                        <Button onClick={handleExport} className="w-full">
                                            📥 Descargar Backup
                                        </Button>
                                    </div>

                                    <div className="border-t border-white/10 pt-4">
                                        <h4 className="text-white font-bold mb-1">Importar Datos</h4>
                                        <p className="text-white/50 text-xs mb-3">Restaura un archivo de backup previamente descargado.</p>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImport}
                                            className="block w-full text-sm text-gray-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[--primary] file:text-black
                                            hover:file:bg-[#bbe400]
                                            cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mt-auto">
                                <h3 className="text-red-500 font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="text-2xl">⚠️</span> Zona de Peligro
                                </h3>

                                <div>
                                    <h4 className="text-white font-bold mb-1">Resetear de Fábrica</h4>
                                    <p className="text-white/50 text-xs mb-3">
                                        Borra TODO (partidos, estadísticas, torneos) y deja la app como nueva.
                                        <br /><strong>No se puede deshacer.</strong>
                                    </p>
                                    <Button onClick={handleReset} variant="danger" className="w-full">
                                        🧨 Borrar Todo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </Card >
        </div >
    );
};
