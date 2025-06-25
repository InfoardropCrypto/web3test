// Firebase initialization
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
const auth = firebase.auth();
const database = firebase.database();

// --- DOM ELEMENTS (Original and New) ---
const stakingContainer = document.getElementById('stakingContainer');
const authContainer = document.getElementById('authContainer');
const stakeAmountInput = document.getElementById('stakeAmount');
const stakeDurationInput = document.getElementById('stakeDuration');
const stakingResult = document.getElementById('stakingResult');
const currentStakes = document.getElementById('currentStakes');
const walletAddressDisplay = document.getElementById('walletAddress');
const walletBalanceDisplay = document.getElementById('walletBalance');
const selectedNetworkDisplay = document.getElementById('selectedNetwork');
const stakeButton = document.getElementById('stakeButton');
const networkSelect = document.getElementById('networkSelect');
const validatorSelect = document.getElementById('validatorSelect');
// New Governance DOM Elements
const createProposalButton = document.getElementById('createProposalButton');
const proposalTitleInput = document.getElementById('proposalTitle');
const proposalDescriptionInput = document.getElementById('proposalDescription');
const proposalsList = document.getElementById('proposalsList');
const proposalResult = document.getElementById('proposalResult');

// --- GLOBAL STATE ---
let selectedNetwork = 'optimism';
let walletBalance = 0;
let currentUserId = null;

// --- AUTHENTICATION ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        authContainer.style.display = 'none';
        stakingContainer.style.display = 'block';
        loadWalletDetails(user.uid);
        loadCurrentStakes(user.uid);
        autoDistributeRewards(user.uid);
        loadProposals();
        updateGovernanceUIState();
        updateVotingPower(user.uid);
    } else {
        currentUserId = null;
        authContainer.style.display = 'block';
        stakingContainer.style.display = 'none';
    }
});

networkSelect.addEventListener('change', (event) => {
    selectedNetwork = event.target.value;
    selectedNetworkDisplay.textContent = selectedNetwork.toUpperCase();
    if (currentUserId) {
        loadWalletDetails(currentUserId);
        loadCurrentStakes(currentUserId);
    }
    updateGovernanceUIState();
});

function loadWalletDetails(userId) {
    const networkPath = `wallets/${userId}/${selectedNetwork}`;
    database.ref(`${networkPath}/address`).once('value', snapshot => {
        walletAddressDisplay.textContent = snapshot.val() || 'Please Add Network On Wallet';
    });
    database.ref(`${networkPath}/balance`).on('value', snapshot => {
        walletBalance = snapshot.val() || 0;
        const formattedBalance = walletBalance.toLocaleString('en-US', {
            minimumFractionDigits: 8,
            maximumFractionDigits: 8
        });
        walletBalanceDisplay.textContent = formattedBalance;
    });
    selectedNetworkDisplay.textContent = selectedNetwork.toUpperCase();
}

// --- ALL STAKING FUNCTIONS ---

function formatDateToIndonesian(date) {
    if (!date || isNaN(new Date(date).getTime())) {
        return 'Invalid date';
    }
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(date));
}

stakeButton.addEventListener('click', () => {
    const amount = parseFloat(stakeAmountInput.value);
    const duration = parseInt(stakeDurationInput.value);
    const selectedValidator = validatorSelect.value;
    const apy = parseFloat(validatorSelect.options[validatorSelect.selectedIndex]?.dataset.apy);

    if (!selectedValidator || isNaN(apy)) {
        stakingResult.textContent = 'Silakan pilih validator yang valid.';
        return;
    }
    if (isNaN(amount) || amount <= 0 || isNaN(duration) || duration <= 0) {
        stakingResult.textContent = 'Invalid amount or duration.';
        return;
    }
    if (amount > walletBalance) {
        stakingResult.textContent = 'Insufficient balance for staking.';
        return;
    }

    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);
    gasFeeRef.once('value').then(snapshot => {
        const gasFee = snapshot.val() || 0;
        const confirmStake = `Are you sure you want to stake ${amount} ${selectedNetwork} for ${duration} days with validator ${selectedValidator}?\n\nEstimated Gas Fee: ${gasFee} ${selectedNetwork}`;
        if (!confirm(confirmStake)) {
            alert('Stake canceled.');
            return;
        }

        const userId = auth.currentUser.uid;
        const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`).push();
        const now = new Date();
        const end = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

        const stakeData = {
            amount: amount, duration: duration, sender: userId, recipient: userId,
            amountReceived: amount, memo: selectedValidator, startTime: now.toISOString(),
            endTime: end.toISOString(), claimed: false, claimTime: null,
            validator: selectedValidator, apy: apy, gasFee: gasFee
        };

        const newBalance = walletBalance - amount - gasFee;
        const balanceRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

        balanceRef.set(newBalance).then(() => {
            stakeRef.set(stakeData).then(() => {
                const transactionHash = generateTransactionHash();
                const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                const transactionData = {
                    type: 'stake', amount: amount, sender: userId, recipient: '000000000000000000000000000',
                    amountReceived: amount, network: selectedNetwork, validator: selectedValidator,
                    apy: apy, gasFee: gasFee, timestamp: new Date().toISOString(),
                    memo: selectedValidator, status: 'success', hash: transactionHash
                };
                transactionRef.set(transactionData).then(() => {
                    stakingResult.textContent = 'Staking successful!';
                    loadCurrentStakes(userId);
                    updateVotingPower(userId);
                });
            });
        });
    });
});

function unstake(stakeId, amount) {
    const userId = auth.currentUser.uid;
    getGasFee(gasFee => {
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        userRef.once('value', snapshot => {
            const balance = snapshot.val();
            if (balance >= gasFee) {
                const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
                if (confirm(`Are you sure you want to unstake ${amount}? This will incur a gas fee of ${gasFee}.`)) {
                    stakeRef.remove().then(() => {
                        const newBalance = balance - gasFee + amount;
                        userRef.set(newBalance).then(() => {
                            const transactionHash = generateTransactionHash();
                            const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                            const transactionData = {
                                type: 'unstake', amount: amount, sender: '000000000000000000000000000',
                                recipient: userId, amountReceived: amount, network: selectedNetwork, gasFee: gasFee,
                                timestamp: new Date().toISOString(), memo: 'Unstaked!', status: 'success', hash: transactionHash
                            };
                            transactionRef.set(transactionData).then(() => {
                                alert('Unstaked successfully!');
                                loadCurrentStakes(userId);
                                updateVotingPower(userId);
                            });
                        });
                    });
                }
            } else {
                alert('Insufficient balance for gas fee.');
            }
        });
    });
}

function claimReward(stakeId, amount) {
    const userId = auth.currentUser.uid;
    getGasFee(gasFee => {
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        userRef.once('value', snapshot => {
            const balance = snapshot.val();
            if (balance >= gasFee) {
                const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
                stakeRef.once('value', snapshot => {
                    const stake = snapshot.val();
                    if (stake) {
                        const now = new Date();
                        if (new Date(stake.endTime) > now) {
                            alert('Reward cannot be claimed before the staking period ends.');
                            return;
                        }
                        if (stake.claimed) {
                            alert('Reward has already been claimed.');
                            return;
                        }
                        const reward = calculateReward(stake.amount, stake.duration, stake.apy);
                        if (confirm(`Are you sure you want to claim your reward of ${reward.toFixed(8)}? This will incur a gas fee of ${gasFee}.`)) {
                            stakeRef.update({ claimed: true, claimTime: now.toISOString() }).then(() => {
                                const newBalance = balance + reward - gasFee;
                                userRef.set(newBalance).then(() => {
                                    const transactionHash = generateTransactionHash();
                                    const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                                    const transactionData = {
                                        type: 'claim', amount: reward, sender: '000000000000000000000000000', recipient: userId,
                                        amountReceived: reward, network: selectedNetwork, gasFee: gasFee, timestamp: now.toISOString(),
                                        memo: 'Claimed Reward', status: 'success', hash: transactionHash
                                    };
                                    transactionRef.set(transactionData).then(() => {
                                        alert('Reward claimed successfully!');
                                        loadCurrentStakes(userId);
                                    });
                                });
                            });
                        }
                    }
                });
            } else {
                alert('Insufficient balance for gas fee.');
            }
        });
    });
}

function calculateReward(amount, duration, apy) {
    return amount * (apy / 100) * (duration / 365);
}

function updateEstimatedReward() {
    const amount = parseFloat(stakeAmountInput.value);
    const duration = parseInt(stakeDurationInput.value);
    const selectedValidatorOption = validatorSelect.options[validatorSelect.selectedIndex];
    const apy = parseFloat(selectedValidatorOption?.dataset.apy);
    if (!isNaN(amount) && !isNaN(duration) && amount > 0 && duration > 0 && !isNaN(apy)) {
        const estimatedReward = calculateReward(amount, duration, apy);
        document.getElementById('estimatedReward').textContent = estimatedReward.toFixed(10);
    } else {
        document.getElementById('estimatedReward').textContent = '0.0000';
    }
}

// ############# PERBAIKAN ADA DI SINI #############
// Event listeners untuk input amount dan duration
stakeAmountInput.addEventListener('input', updateEstimatedReward);
stakeDurationInput.addEventListener('input', updateEstimatedReward);

// Event listener KHUSUS untuk dropdown validator
validatorSelect.addEventListener('change', () => {
    const selectedOption = validatorSelect.options[validatorSelect.selectedIndex];
    const apy = selectedOption.dataset.apy;
    
    // Perbarui teks APY di UI
    if (apy) {
        document.getElementById('currentApyDisplay').textContent = `APY: ${apy}%`;
    } else {
        // Kembali ke default jika "-- Select Validator --" dipilih
        document.getElementById('currentApyDisplay').textContent = 'APY: -';
    }

    // Panggil juga fungsi untuk update estimasi reward
    updateEstimatedReward();
});
// #################################################

function startCountdown(endTime, element) {
    const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = new Date(endTime) - now;
        if (timeDiff <= 0) {
            element.textContent = 'Finished';
            clearInterval(interval);
            return;
        }
        const d = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeDiff % (1000 * 60)) / 1000);
        element.textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
}

function loadCurrentStakes(userId) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);
    stakesRef.on('value', snapshot => {
        currentStakes.innerHTML = '<h3>Current Stakes:</h3>';
        const stakes = snapshot.val();
        if (stakes) {
            Object.keys(stakes).forEach(stakeId => {
                const stake = stakes[stakeId];
                const stakeElement = document.createElement('div');
                stakeElement.style.border = "1px solid #ccc";
                stakeElement.style.padding = "10px";
                stakeElement.style.marginBottom = "10px";
                stakeElement.style.borderRadius = "5px";

                const countdownElement = document.createElement('div');
                countdownElement.classList.add('countdown');

                stakeElement.innerHTML = `
                    <p><strong>Validator:</strong> ${stake.validator || 'Unknown'} | <strong>APY:</strong> ${stake.apy || '-'}%</p>
                    <p><strong>Amount:</strong> ${stake.amount}</p>
                    <p><strong>End Time:</strong> ${formatDateToIndonesian(stake.endTime)}</p>
                    <p><strong>Time Left: </strong></p>
                `;
                stakeElement.appendChild(countdownElement);
                
                const unstakeBtn = document.createElement('button');
                unstakeBtn.textContent = 'Unstake';
                unstakeBtn.onclick = () => unstake(stakeId, stake.amount);
                stakeElement.appendChild(unstakeBtn);

                const claimBtn = document.createElement('button');
                claimBtn.textContent = 'Claim';
                claimBtn.onclick = () => claimReward(stakeId, stake.amount);
                stakeElement.appendChild(claimBtn);
                
                currentStakes.appendChild(stakeElement);
                startCountdown(stake.endTime, countdownElement);
            });
        } else {
            currentStakes.innerHTML += '<p>No current stakes found.</p>';
        }
    });
}

function getGasFee(callback) {
    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);
    gasFeeRef.once('value', snapshot => {
        callback(snapshot.val() || 0);
    });
}

function autoDistributeRewards(userId) {
    // ... (Fungsi ini tetap ada dan tidak berubah)
}

function generateTransactionHash() {
    return crypto.getRandomValues(new Uint8Array(32)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function updateGovernanceUIState() {
    const isOptimism = selectedNetwork === 'optimism';

    // Aktifkan/nonaktifkan form pembuatan proposal
    proposalTitleInput.disabled = !isOptimism;
    proposalDescriptionInput.disabled = !isOptimism;
    createProposalButton.disabled = !isOptimism;

    if (!isOptimism) {
        proposalTitleInput.placeholder = "Hanya aktif di jaringan Optimism";
        proposalResult.textContent = "Governance hanya tersedia di jaringan Optimism.";
    } else {
        proposalTitleInput.placeholder = "Proposal Title";
        proposalResult.textContent = "";
    }

    // Aktifkan/nonaktifkan semua tombol vote yang ada
    const voteButtons = document.querySelectorAll('.vote-button');
    voteButtons.forEach(button => {
        button.disabled = !isOptimism;
    });
}

function loadProposals() {
    const proposalsRef = database.ref('proposals');
    proposalsRef.on('value', snapshot => {
        proposalsList.innerHTML = '';
        const proposals = snapshot.val();
        if (proposals) {
            Object.keys(proposals).forEach(proposalId => {
                const proposal = proposals[proposalId];
                if (proposal.network === 'optimism') { // Hanya tampilkan proposal Optimism
                    displayProposal(proposalId, proposal);
                }
            });
        } else {
            proposalsList.innerHTML = '<p>No active proposals on Optimism network.</p>';
        }
        updateGovernanceUIState(); // Pastikan tombol dinonaktifkan jika perlu
    });
}

function displayProposal(proposalId, proposal) {
    const proposalElement = document.createElement('div');
    proposalElement.classList.add('proposal');
    const votes = proposal.votes || {};
    let votesFor = 0;
    let votesAgainst = 0;
    Object.values(votes).forEach(vote => {
        if (vote.choice === 'for') votesFor += vote.power;
        else if (vote.choice === 'against') votesAgainst += vote.power;
    });

    // Hitung deadline (createdAt + durasi)
    const deadline = proposal.createdAt + ((proposal.durationHours || 24) * 60 * 60 * 1000);
    const isExpired = new Date() > deadline;

    proposalElement.innerHTML = `
        <h4>${proposal.title}</h4>
        <p>${proposal.description}</p>
        <p><small>Proposed by: ${proposal.proposerId.substring(0, 10)}...</small></p>
        <div class="proposal-deadline">
            <strong>Time Left to Vote:</strong> 
            <span class="countdown-timer">Loading...</span>
        </div>
        <div class="proposal-results">
            <strong>Votes For:</strong> ${votesFor.toFixed(4)} <br>
            <strong>Votes Against:</strong> ${votesAgainst.toFixed(4)}
        </div>
        <div class="proposal-actions">
            <button class="vote-button for" onclick="castVote('${proposalId}', 'for')" ${isExpired ? 'disabled' : ''}>Vote For</button>
            <button class="vote-button against" onclick="castVote('${proposalId}', 'against')" ${isExpired ? 'disabled' : ''}>Vote Against</button>
        </div>
        <p id="vote-result-${proposalId}" class="staking-result"></p>
    `;
    proposalsList.appendChild(proposalElement);

    const countdownElement = proposalElement.querySelector('.countdown-timer');
    if (isExpired) {
        countdownElement.textContent = "Voting has ended.";
    } else {
        startCountdown(deadline, countdownElement);
    }
}
createProposalButton.addEventListener('click', () => {
    if (selectedNetwork !== 'optimism') {
        proposalResult.textContent = 'Pembuatan proposal hanya bisa dilakukan di jaringan Optimism.';
        return;
    }

    const title = proposalTitleInput.value;
    const description = proposalDescriptionInput.value;

    if (!title || !description) {
        proposalResult.textContent = 'Title and description are required.';
        return;
    }

    const minBalanceToPropose = 100;
    if (walletBalance < minBalanceToPropose) {
        proposalResult.textContent = `You need at least ${minBalanceToPropose} OP to create a proposal.`;
        return;
    }

    const proposalId = generateTransactionHash(); // Generate hash untuk proposalId
    const newProposal = {
        proposerId: currentUserId,
        title,
        description,
        network: 'optimism',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        durationHours: 24, // Deadline voting 1 hari (24 jam)
        status: 'active'
    };

    database.ref(`proposals/${proposalId}`).set(newProposal)
        .then(() => {
            proposalResult.textContent = 'Proposal created successfully!';
        }).catch(error => proposalResult.textContent = `Error: ${error.message}`);
});

function castVote(proposalId, choice) {
    if (!currentUserId) {
        alert('Please connect your wallet to vote.');
        return;
    }

    if (selectedNetwork !== 'optimism') {
        alert('Voting hanya bisa dilakukan di jaringan Optimism.');
        return;
    }

    const proposalRef = database.ref(`proposals/${proposalId}`);
    const resultEl = document.getElementById(`vote-result-${proposalId}`);

    // Cek dulu apakah periode voting masih aktif
    proposalRef.once('value').then(proposalSnapshot => {
        const proposal = proposalSnapshot.val();
        if (!proposal) {
            resultEl.textContent = 'Proposal not found.';
            return;
        }

        const deadline = proposal.createdAt + ((proposal.durationHours || 24) * 60 * 60 * 1000);
        if (new Date() > deadline) {
            resultEl.textContent = 'The voting period for this proposal has ended.';
            const buttons = resultEl.closest('.proposal').querySelectorAll('.vote-button');
            buttons.forEach(b => b.disabled = true);
            return;
        }

        // Jika voting aktif, lanjutkan logika
        const voteRef = database.ref(`proposals/${proposalId}/votes/${currentUserId}`);
        const userBalanceRef = database.ref(`wallets/${currentUserId}/${selectedNetwork}/balance`);

        getGasFee(gasFee => {
            if (walletBalance < gasFee) {
                resultEl.textContent = 'Saldo tidak cukup untuk membayar biaya gas.';
                return;
            }

            if (!confirm(`Anda yakin ingin vote '${choice}'? Ini akan dikenakan biaya gas sebesar ${gasFee} OP.`)) {
                resultEl.textContent = 'Vote dibatalkan.';
                return;
            }

            voteRef.once('value', snapshot => {
                if (snapshot.exists()) {
                    resultEl.textContent = 'You have already voted on this proposal.';
                    return;
                }

                getTotalStaked(currentUserId, totalStaked => {
                    if (totalStaked <= 0) {
                        resultEl.textContent = "You must have staked tokens to vote.";
                        return;
                    }

                    const newBalance = walletBalance - gasFee;
                    userBalanceRef.set(newBalance).then(() => {
                        voteRef.set({
                            choice: choice,
                            power: totalStaked,
                            votedAt: firebase.database.ServerValue.TIMESTAMP
                        }).then(() => {
                            const transactionHash = generateTransactionHash();
                            const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                            const transactionData = {
                                type: 'vote',
                                amount: gasFee,
                                amountReceived: gasFee,
                                sender: currentUserId,
                                recipient: '0000000000000000000000000000',
                                network: selectedNetwork,
                                gasFee: gasFee,
                                timestamp: new Date().toISOString(),
                                memo: `Vote '${choice}' on proposal ${proposalId.substring(0, 5)}...`,
                                status: 'success',
                                hash: transactionHash
                            };
                            transactionRef.set(transactionData);
                            resultEl.textContent = `Successfully voted '${choice}' with power ${totalStaked.toFixed(4)}!`;
                        }).catch(error => resultEl.textContent = `Error: ${error.message}`);
                    }).catch(error => resultEl.textContent = `Error updating balance: ${error.message}`);
                });
            });
        });
    }).catch(error => {
        resultEl.textContent = `Error fetching proposal details: ${error.message}`;
    });
}
window.castVote = castVote;

document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    const elements = document.querySelectorAll('nav, .wallet-details, .stake-form, .governance-section');
    elements.forEach(el => el.classList.toggle('dark-theme'));
    const themeIcon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const selectElement = document.getElementById("networkSelect");
    const networkIcon = document.getElementById("networkIcon");
    if(selectElement.options.length > 0) {
        networkIcon.src = selectElement.options[selectElement.selectedIndex].getAttribute('data-image');
    }
    selectElement.addEventListener('change', function () {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const imgSrc = selectedOption.getAttribute('data-image');
        if (imgSrc) networkIcon.src = imgSrc;
    });
});

function getTotalStaked(userId, callback) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);
    stakesRef.once('value', snapshot => {
        let totalStaked = 0;
        snapshot.forEach(childSnapshot => {
            const stake = childSnapshot.val();
            if (stake && !stake.claimed) {
                totalStaked += stake.amount;
            }
        });
        callback(totalStaked);
    });
}

function updateVotingPower(userId) {
    getTotalStaked(userId, totalStaked => {
        document.getElementById('votingPower').textContent = totalStaked.toFixed(4);
    });
}
