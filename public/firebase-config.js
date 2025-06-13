import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBD668hpTjKsy9i7wdyXV0fx5DXNWEXDDE",
    authDomain: "saper-game-ok28.firebaseapp.com",
    projectId: "saper-game-ok28",
    storageBucket: "saper-game-ok28.firebasestorage.app",
    messagingSenderId: "911886302871",
    appId: "1:911886302871:web:e0541996bf8511fe87f3d2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addData(mode, playerID, playerName, time) {
    try {
        const q = query(
            collection(db, "scores"),
            where("playerID", "==", playerID),
            where("playerName", "==", playerName),
            where("mode", "==", mode)
        );

        const querySnapshot = await getDocs(q);
        let oldDocDeleted = false;

        for (const document of querySnapshot.docs) {
            const existingTime = document.data().time;

            if (existingTime > time) {
                await deleteDoc(document.ref); 
                console.log(`Старий рекорд з ID: ${document.id} (час: ${existingTime}) було видалено, оскільки новий час (${time}) кращий.`);
                oldDocDeleted = true;
            } else {
                console.log(`Існуючий рекорд з ID: ${document.id} (час: ${existingTime}) не гірший за новий час (${time}).`);
            }
        }
        
        const docRef = await addDoc(collection(db, "scores"), {
            mode: mode,
            playerID: playerID,
            playerName: playerName,
            time: time,
            timestamp: new Date()
        });

        console.log("Документ успішно додано з ID: ", docRef.id);
        return { 
            success: true, 
            docId: docRef.id, 
            message: oldDocDeleted ? "Новий рекорд додано, старий (гірший) видалено." : "Новий рекорд додано." 
        };
    } catch (e) {
        console.error("Помилка при додаванні/видаленні документа: ", e);
        return { success: false, error: e.message };
    }
}

export async function getScoresFromFirestore() {
    try {
        const scoresQuery = query(collection(db, "scores"), orderBy("time", "asc"), limit(20));
        const querySnapshot = await getDocs(scoresQuery);

        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push({ id: doc.id, ...doc.data() });
        });
        console.log("Рекорди успішно завантажено.");
        return { success: true, scores: scores };
    } catch (e) {
        console.error("Помилка при отриманні документів: ", e);
        return { success: false, error: e.message, scores: [] };
    }
}