import { db } from '../config/firebase';
import { doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

const PLAYERS_KEY = 'fifa_players';
const MATCHES_KEY = 'fifa_matches';
const TOURNAMENTS_KEY = 'fifa_tournaments';

const DEFAULT_PLAYERS = [
    { id: 'guido', name: 'Guido', image: '/guido.png', points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
    { id: 'filippo', name: 'Filippo', image: '/filippo.png', points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
    { id: 'luca', name: 'Luca', image: '/luca.png', points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
    { id: 'martino', name: 'Martino', image: '/martino.png', points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
];

export const StorageService = {
    // --- Cloud Sync Helper ---
    _pushToCloud: async (collection, data) => {
        try {
            if (!db) return;
            // Use ID as document key
            await setDoc(doc(db, collection, data.id.toString()), data);
            console.log(`Cloud Push: ${collection}/${data.id}`);
        } catch (e) {
            console.warn("Cloud push failed:", e);
            alert(`⚠️ ERROR GUARDANDO EN LA NUBE (${collection}):\n\n${e.message}\n\nLos datos se guardaron LOCALMENTE, pero podrían perderse si borras caché o cambias de dispositivo.`);
        }
    },

    // --- Players ---
    getPlayers: () => {
        const stored = localStorage.getItem(PLAYERS_KEY);
        if (!stored) {
            localStorage.setItem(PLAYERS_KEY, JSON.stringify(DEFAULT_PLAYERS));
            return DEFAULT_PLAYERS;
        }
        return JSON.parse(stored);
    },

    updatePlayers: (players, skipCloud = false) => {
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
        // Cloud Sync
        if (!skipCloud) {
            players.forEach(p => StorageService._pushToCloud('players', p));
        }
    },

    resetStats: () => {
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(DEFAULT_PLAYERS));
        localStorage.setItem(MATCHES_KEY, JSON.stringify([]));
        localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify([]));
    },

    // --- Data Management ---
    exportData: () => {
        const data = {
            players: StorageService.getPlayers(),
            matches: StorageService.getMatches(),
            tournaments: StorageService.getTournaments(),
            timestamp: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    importData: (jsonString) => {
        try {
            const data = JSON.parse(jsonString);
            // Basic validation
            if (!data.players || !Array.isArray(data.players)) throw new Error("Invalid players data");

            localStorage.setItem(PLAYERS_KEY, JSON.stringify(data.players));
            localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches || []));
            localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(data.tournaments || []));
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    },

    // --- Matches ---
    getMatches: () => {
        const stored = localStorage.getItem(MATCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    addMatches: (newMatches) => {
        const matches = StorageService.getMatches();

        // Prepare local updates
        const matchesToAdd = newMatches.map(m => ({
            ...m,
            id: m.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: m.date || new Date().toISOString()
        }));

        const updatedMatches = [...matches, ...matchesToAdd];
        localStorage.setItem(MATCHES_KEY, JSON.stringify(updatedMatches));

        // Update Stats for all
        matchesToAdd.forEach(m => StorageService._updatePlayerStatsFromMatch(m));

        // Cloud Sync (Batch)
        if (db) {
            try {
                const batch = writeBatch(db);
                matchesToAdd.forEach(m => {
                    const ref = doc(db, 'matches', m.id.toString());
                    batch.set(ref, m);
                });
                batch.commit().then(() => console.log(`Cloud: Batched ${matchesToAdd.length} matches`));
            } catch (e) {
                console.error("Cloud batch push failed", e);
                alert(`⚠️ ERROR SUBIENDO PARTIDOS A LA NUBE:\n\n${e.message}`);
            }
        }

        return matchesToAdd;
    },

    addMatch: (match) => {
        // match: { id, date, type: 'duel'|'tourney3'|'tourney4', players: [p1_id, p2_id], scores: { [p1_id]: 2, [p2_id]: 1 }, context: {} }
        const matches = StorageService.getMatches();
        const newMatch = {
            ...match,
            id: match.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: match.date || new Date().toISOString()
        };
        matches.push(newMatch);
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));

        // Update player stats automatically
        StorageService._updatePlayerStatsFromMatch(newMatch);

        // Cloud Sync
        StorageService._pushToCloud('matches', newMatch);

        return newMatch;
    },

    updateMatch: (updatedMatch) => {
        const matches = StorageService.getMatches();
        const index = matches.findIndex(m => m.id === updatedMatch.id);
        if (index !== -1) {
            matches[index] = updatedMatch;
            // Overwrite and Recalc
            StorageService._overwriteMatches(matches); // This triggers recalc
            // Cloud Sync
            StorageService._pushToCloud('matches', updatedMatch);
            return true;
        }
        return false;
    },

    deleteMatch: async (matchId) => {
        const matches = StorageService.getMatches();
        const initialLength = matches.length;
        const filtered = matches.filter(m => m.id !== matchId);

        if (filtered.length !== initialLength) {
            StorageService._overwriteMatches(filtered); // Recalcs stats

            // Cloud Sync
            if (db) {
                // We need a delete method in CloudService, or just do it here?
                // Better to call CloudService to keep logic separated, but we can't import CloudService here easily due to circular deps if not careful.
                // Actually CloudService imports StorageService. So StorageService should NOT import CloudService.
                // We will handle Cloud deletion in the View or via a callback? 
                // Alternatively, we can use the db instance here directly as we do for _pushToCloud.
                try {
                    // Use top-level imports
                    await deleteDoc(doc(db, 'matches', matchId.toString()));
                    console.log(`Cloud: Deleted match ${matchId}`);
                } catch (e) {
                    console.error("Error deleting from cloud", e);
                    alert(`⚠️ ERROR BORRANDO DE LA NUBE:\n\n${e.message}\n\nEl partido volverá a aparecer si recargas la página porque la Nube rechazó el borrado.`);
                }
            }
            return true;
        }
        return false;
    },

    // --- Cloud Sync Helpers ---
    _overwriteMatches: (matches) => {
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        // We should also recalculate stats from scratch here to be safe
        StorageService._recalcAllStats(matches);
    },

    _overwriteTournaments: (tournaments) => {
        localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
    },

    _recalcAllStats: (matches) => {
        // Reset Players
        const players = StorageService.getPlayers().map(p => ({
            ...p, points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0
        }));

        matches.forEach(m => {
            // Re-run logic from _updatePlayerStatsFromMatch but for the whole batch
            // Simplification: call getStats({}) which logic is already there? 
            // Better to just save the reset players and let getStats handle calculation on View load?
            // Actually getStats calculates ON THE FLY. 
            // The 'players' in localStorage DO store cumulative stats. We need to update those.
            // Complex. For now, let's just use the logic we have.

            // Re-implementation of update logic for a match
            const p1Id = m.players[0]; const p2Id = m.players[1];
            const s1 = parseInt(m.scores[p1Id] || 0); const s2 = parseInt(m.scores[p2Id] || 0);
            const p1 = players.find(p => p.id === p1Id); const p2 = players.find(p => p.id === p2Id);
            if (p1 && p2) {
                p1.matchesPlayed++; p1.gf += s1; p1.ga += s2;
                p2.matchesPlayed++; p2.gf += s2; p2.ga += s1;
                if (s1 > s2) { p1.won++; p1.points += 3; p2.lost++; }
                else if (s2 > s1) { p2.won++; p2.points += 3; p1.lost++; }
                else { p1.drawn++; p1.points += 1; p2.drawn++; p2.points += 1; }
            }
        });
        StorageService.updatePlayers(players);
    },

    _updatePlayerStatsFromMatch: (match) => {
        const players = StorageService.getPlayers();
        const p1Id = match.players[0];
        const p2Id = match.players[1];

        const s1 = parseInt(match.scores[p1Id] || 0);
        const s2 = parseInt(match.scores[p2Id] || 0);

        const p1 = players.find(p => p.id === p1Id);
        const p2 = players.find(p => p.id === p2Id);

        if (p1 && p2) {
            p1.matchesPlayed++;
            p1.gf += s1;
            p1.ga += s2;

            p2.matchesPlayed++;
            p2.gf += s2;
            p2.ga += s1;

            if (s1 > s2) {
                p1.won++;
                p2.lost++;
                p1.points += 3;
            } else if (s2 > s1) {
                p2.won++;
                p1.lost++;
                p2.points += 3;
            } else {
                p1.drawn++;
                p2.drawn++;
                p1.points += 1;
                p2.points += 1;
            }

            StorageService.updatePlayers(players);
        }
    },

    // --- Tournaments ---
    getTournaments: () => {
        const stored = localStorage.getItem(TOURNAMENTS_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    saveTournament: (tournament) => {
        const tournaments = StorageService.getTournaments();
        // If exists update, else add
        const index = tournaments.findIndex(t => t.id === tournament.id);
        if (index >= 0) {
            tournaments[index] = tournament;
        } else {
            tournaments.push(tournament);
        }
        localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));

        // Cloud Sync
        StorageService._pushToCloud('tournaments', tournament);
    },
    // --- Stats & History ---
    getStats: (filter = {}) => {
        // filter: { type: 'duel' | 'tourney3' | 'tourney4' }
        const matches = StorageService.getMatches();
        let filteredMatches = matches;

        if (filter.type) {
            filteredMatches = matches.filter(m => m.type === filter.type);
        }

        // Recalculate stats from scratch based on filtered matches
        // Initialize map
        const playersMap = {};
        DEFAULT_PLAYERS.forEach(p => {
            playersMap[p.id] = { ...p, points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
        });

        filteredMatches.forEach(m => {
            const p1Id = m.players[0];
            const p2Id = m.players[1];
            const s1 = parseInt(m.scores[p1Id] || 0);
            const s2 = parseInt(m.scores[p2Id] || 0);

            if (playersMap[p1Id] && playersMap[p2Id]) {
                playersMap[p1Id].matchesPlayed++;
                playersMap[p1Id].gf += s1;
                playersMap[p1Id].ga += s2;

                playersMap[p2Id].matchesPlayed++;
                playersMap[p2Id].gf += s2;
                playersMap[p2Id].ga += s1;

                if (s1 > s2) {
                    playersMap[p1Id].won++;
                    playersMap[p1Id].points += 3;
                    playersMap[p2Id].lost++;
                } else if (s2 > s1) {
                    playersMap[p2Id].won++;
                    playersMap[p2Id].points += 3;
                    playersMap[p1Id].lost++;
                } else {
                    playersMap[p1Id].drawn++;
                    playersMap[p1Id].points += 1;
                    playersMap[p2Id].drawn++;
                    playersMap[p2Id].points += 1;
                }
            }
        });

        return Object.values(playersMap).sort((a, b) => b.points - a.points || b.won - a.won || (b.gf - b.ga) - (a.gf - a.ga));
    },

    getTournamentStats: (filter = {}) => {
        const tournaments = StorageService.getTournaments();
        // filter: { type: 'tourney3' | 'tourney4' } (or ALL, but usually specific)
        let relevantTournaments = tournaments;
        if (filter.type && filter.type !== 'ALL') {
            relevantTournaments = tournaments.filter(t => t.type === filter.type);
        }

        // Initialize Stats Map
        const statsMap = {};
        DEFAULT_PLAYERS.forEach(p => {
            statsMap[p.id] = {
                ...p,
                tournamentsPlayed: 0,
                first: 0,
                second: 0,
                third: 0,
                fourth: 0
            };
        });

        relevantTournaments.forEach(t => {
            if (t.standings) {
                t.standings.forEach(stand => {
                    const p = statsMap[stand.playerId];
                    if (p) {
                        p.tournamentsPlayed++;
                        if (stand.rank === 1) p.first++;
                        else if (stand.rank === 2) p.second++;
                        else if (stand.rank === 3) p.third++;
                        else if (stand.rank === 4) p.fourth++;
                    }
                });
            }
        });

        // Sort by Gold > Silver > Bronze > Fourth
        return Object.values(statsMap).sort((a, b) => {
            if (b.first !== a.first) return b.first - a.first;
            if (b.second !== a.second) return b.second - a.second;
            if (b.third !== a.third) return b.third - a.third;
            return b.fourth - a.fourth;
        });
    },

    getHeadToHead: (p1Id, p2Id, filter = {}) => {
        const matches = StorageService.getMatches();
        let relevantMatches = matches.filter(m =>
            (m.players[0] === p1Id && m.players[1] === p2Id) ||
            (m.players[0] === p2Id && m.players[1] === p1Id)
        );

        if (filter.type && filter.type !== 'ALL') {
            relevantMatches = relevantMatches.filter(m => m.type === filter.type);
        }

        let stats = {
            total: relevantMatches.length,
            p1Wins: 0,
            p2Wins: 0,
            draws: 0,
            p1Goals: 0,
            p2Goals: 0,
            matches: relevantMatches.sort((a, b) => new Date(b.date) - new Date(a.date)) // Newest first
        };

        relevantMatches.forEach(m => {
            const s1 = parseInt(m.scores[p1Id] || 0);
            const s2 = parseInt(m.scores[p2Id] || 0);

            stats.p1Goals += s1;
            stats.p2Goals += s2;

            if (s1 > s2) stats.p1Wins++;
            else if (s2 > s1) stats.p2Wins++;
            else stats.draws++;
        });

        return stats;
    }
};
