import { db } from '../config/firebase';
import { collection, doc, getDocs, setDoc, addDoc, onSnapshot, query, orderBy, writeBatch } from "firebase/firestore";
import { StorageService } from './StorageService';

// Constants
const COLLECTIONS = {
    PLAYERS: 'players',
    MATCHES: 'matches',
    TOURNAMENTS: 'tournaments'
};

export const CloudService = {
    // --- Initial Sync ---
    // --- Actions (Admin Only) ---
    deleteAllData: async () => {
        try {
            // Function to commit batches in chunks of 450 (limit is 500)
            const deleteCollection = async (collectionName) => {
                const q = query(collection(db, collectionName));
                const snapshot = await getDocs(q);
                const docs = snapshot.docs;

                const chunk_size = 450;
                for (let i = 0; i < docs.length; i += chunk_size) {
                    const chunk = docs.slice(i, i + chunk_size);
                    const batch = writeBatch(db);
                    chunk.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            };

            await deleteCollection(COLLECTIONS.MATCHES);
            await deleteCollection(COLLECTIONS.TOURNAMENTS);

            // Reset Players (Chunked update)
            const playersSnapshot = await getDocs(collection(db, COLLECTIONS.PLAYERS));
            const playerDocs = playersSnapshot.docs;
            const chunk_size = 450;

            for (let i = 0; i < playerDocs.length; i += chunk_size) {
                const chunk = playerDocs.slice(i, i + chunk_size);
                const batch = writeBatch(db);
                chunk.forEach(doc => {
                    const p = doc.data();
                    const resetPlayer = {
                        ...p,
                        points: 0, matchesPlayed: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0
                    };
                    batch.set(doc.ref, resetPlayer);
                });
                await batch.commit();
            }

            console.log("ALL CLOUD DATA DELETED/RESET");
            return true;
        } catch (e) {
            console.error("Error deleting cloud data:", e);
            throw e; // Propagate error so UI knows
        }
    },

    syncFromCloud: async (onDataUpdated) => {
        try {
            console.log("Starting Cloud Sync...");

            // Listen to Players
            onSnapshot(collection(db, COLLECTIONS.PLAYERS), (snapshot) => {
                const players = [];
                snapshot.forEach(doc => players.push(doc.data()));
                if (players.length > 0) {
                    StorageService.updatePlayers(players);
                    if (onDataUpdated) onDataUpdated('players');
                }
            });

            // Listen to Matches
            onSnapshot(query(collection(db, COLLECTIONS.MATCHES), orderBy('date', 'desc')), (snapshot) => {
                const matches = [];
                snapshot.forEach(doc => matches.push(doc.data()));
                StorageService._overwriteMatches(matches); // We need this method in StorageService
                if (onDataUpdated) onDataUpdated('matchesAndStats');
            });

            // Listen to Tournaments
            onSnapshot(collection(db, COLLECTIONS.TOURNAMENTS), (snapshot) => {
                const tournaments = [];
                snapshot.forEach(doc => tournaments.push(doc.data()));
                StorageService._overwriteTournaments(tournaments); // We need this method in StorageService
                if (onDataUpdated) onDataUpdated('tournaments');
            });

        } catch (error) {
            console.error("Error syncing with cloud:", error);
        }
    },

    // --- Actions (Admin Only) ---
    uploadLocalData: async () => {
        // One-time PUSH local data to Cloud (Admin Init)
        const players = StorageService.getPlayers();
        const matches = StorageService.getMatches();
        const tournaments = StorageService.getTournaments();

        const batch = writeBatch(db);

        players.forEach(p => {
            const ref = doc(db, COLLECTIONS.PLAYERS, p.id);
            batch.set(ref, p);
        });

        matches.forEach(m => {
            const ref = doc(db, COLLECTIONS.MATCHES, m.id);
            batch.set(ref, m);
        });

        tournaments.forEach(t => {
            const ref = doc(db, COLLECTIONS.TOURNAMENTS, t.id);
            batch.set(ref, t);
        });

        await batch.commit();
        console.log("Local data uploaded to Cloud!");
        return true;
    },

    addMatch: async (match) => {
        // Add to Cloud only. The listener will update Local.
        const ref = doc(db, COLLECTIONS.MATCHES, match.id);
        await setDoc(ref, match);

        // Also update impacted players in Cloud?? 
        // Better to recalculate stats on client for now to avoid Cloud Functions cost/complexity.
        // BUT, for persistence, we should update player docs in Cloud too.

        // Calculation logic is duplicated from StorageService for now
        // A better approach for V2 is Cloud Functions triggers.
        // For now, we trust the Client to Push the updated Player stats too.
    },

    updatePlayers: async (players) => {
        const batch = writeBatch(db);
        players.forEach(p => {
            const ref = doc(db, COLLECTIONS.PLAYERS, p.id);
            batch.set(ref, p);
        });
        await batch.commit();
    },

    saveTournament: async (tournament) => {
        const ref = doc(db, COLLECTIONS.TOURNAMENTS, tournament.id);
        await setDoc(ref, tournament);
    }
};
