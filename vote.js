const firebaseConfig = {
            apiKey: "AIzaSyCtvxvFSXOT0fkRpl84U6LTD8xg8rGWrV8",
            authDomain: "web3-iac-wallet.firebaseapp.com",
            databaseURL: "https://web3-iac-wallet-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "web3-iac-wallet",
            storageBucket: "web3-iac-wallet.firebasestorage.app",
            messagingSenderId: "462702808978",
            appId: "1:462702808978:web:843402ceb14d9eb026bb4b",
            measurementId: "G-H8W6VMJJPH"
        };
        
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        function createVoting() {
            const title = document.getElementById("votingTitle").value.trim();
            const option1 = document.getElementById("option1").value.trim();
            const option2 = document.getElementById("option2").value.trim();
            const duration = parseInt(document.getElementById("duration").value);

            if (!title || !option1 || !option2 || isNaN(duration) || duration <= 0) {
                alert("Semua field harus diisi dengan benar!");
                return;
            }

            const endTime = Date.now() + duration * 60000;
            const userId = "user123";
            const votingData = {
    title: title,
    candidates: [option1, option2],
    endTime: endTime,
    votes: {},
    voters: {},
    creator: userId,
    createdAt: Date.now() // Tambahkan timestamp
};
            votingData.votes[option1] = 0;
            votingData.votes[option2] = 0;
            
            const votingRef = database.ref('votings').push();
            votingRef.set(votingData).then(() => {
                loadVotings();
                alert("Voting berhasil dibuat!");
            });
        }

        function loadVotings() {
    const voteOptions = document.getElementById("voteOptions");
    voteOptions.innerHTML = "";

    database.ref("votings").orderByChild("createdAt").on("value", snapshot => {
        const votings = [];
        snapshot.forEach(childSnapshot => {
            votings.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        // Balik urutan agar yang terbaru ada di atas
        votings.reverse();
        voteOptions.innerHTML = "";

        votings.forEach(voting => {
            const votingId = voting.id;
            const userId = "user123"; // Ganti dengan user login
            const div = document.createElement("div");
            div.innerHTML = `<hr> <br> <h3>${voting.title}</h3> <br>`;

            const countdown = document.createElement("p");
            countdown.className = "countdown";
            div.appendChild(countdown);

            function updateCountdown() {
                const now = Date.now();
                const timeLeft = voting.endTime - now;
                if (timeLeft <= 0) {
                    countdown.innerHTML = `<strong style="font-family:inherit;color:#d6721a;">Voting sudah berakhir!</strong>`;
                } else {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    countdown.innerHTML = `<p style="color:#561ad6;">Sisa Waktu: ${minutes} menit ${seconds} detik</p>`;
                }
            }

            setInterval(updateCountdown, 1000);
            updateCountdown();

            // Cek apakah user sudah vote
            if (!voting.voters || !voting.voters[userId]) {
                voting.candidates.forEach(candidate => {
                    const button = document.createElement("button");
                    button.textContent = candidate;
                    button.className = "vote-button";
                    button.onclick = () => vote(votingId, candidate);
                    div.appendChild(button);
                });
            } else {
                div.innerHTML += "<strong>Anda sudah memberikan suara.</strong>";
            }

            const resultsDiv = document.createElement("div");
            resultsDiv.id = `results-${votingId}`;
            div.appendChild(resultsDiv);
            voteOptions.appendChild(div);
            updateResults(votingId);

            // Tombol hapus hanya untuk pembuat voting dan jika voting belum berakhir
            
        });
    });
}

        function vote(votingId, candidate) {
            const userId = "user123";
            const votingRef = database.ref(`votings/${votingId}`);
            votingRef.once("value", snapshot => {
                const voting = snapshot.val();
                if (Date.now() > voting.endTime) {
                    alert("Voting sudah berakhir!");
                    return;
                }
                if (voting.voters && voting.voters[userId]) {
                    alert("Anda sudah memberikan suara!");
                    return;
                }
                
                database.ref(`votings/${votingId}/votes/${candidate}`).transaction(currentVotes => (currentVotes || 0) + 1);
                database.ref(`votings/${votingId}/voters/${userId}`).set(true).then(() => loadVotings());
            });
        }

        

        function updateResults(votingId) {
            const resultsDiv = document.getElementById(`results-${votingId}`);
            database.ref(`votings/${votingId}/votes`).on("value", snapshot => {
                resultsDiv.innerHTML = "<h4>Hasil Voting:</h4>";
                snapshot.forEach(child => {
                    const p = document.createElement("p");
                    p.textContent = `${child.key}: ${child.val()} suara`;
                    resultsDiv.appendChild(p);
                });
            });
        }

        window.onload = loadVotings;
        
        function startAutoVoting(interval = 1) {
    setInterval(() => {
        database.ref("votings").once("value", snapshot => {
            const votings = snapshot.val();
            if (!votings) return;

            Object.keys(votings).forEach(votingId => {
                const voting = votings[votingId];
                if (Date.now() > voting.endTime) return; // Lewati jika voting sudah berakhir
                
                const userId = "bot123"; // Bisa diubah untuk bot yang berbeda
                const candidates = Object.keys(voting.votes || {});
                if (candidates.length === 0) return; // Lewati jika tidak ada kandidat
                
                const botCandidate = candidates[Math.floor(Math.random() * candidates.length)]; // Pilih kandidat acak

                // Tambahkan vote ke kandidat yang dipilih tanpa batasan
                database.ref(`votings/${votingId}/votes/${botCandidate}`).transaction(currentVotes => (currentVotes || 0) + 1);
                
                console.log(`Bot ${userId} voted for ${botCandidate} in voting ${votingId}`);
            });
        });
    }, interval);
}

// Jalankan bot auto vote setiap 5 detik
startAutoVoting();
