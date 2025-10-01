var firebaseConfig = {
  apiKey: "AIzaSyBtoafs5RAPyMYO4VwIWEMb98Ye_X0w-EA",
  authDomain: "web3-iac.firebaseapp.com",
  databaseURL: "https://web3-iac-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web3-iac",
  storageBucket: "web3-iac.firebasestorage.app",
  messagingSenderId: "177980099871",
  appId: "1:177980099871:web:9ecb0cc57ac00b757c342a",
  measurementId: "G-9VG2WXG47T"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
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
const autoCompoundCheckbox = document.getElementById('autoCompound');
const createProposalButton = document.getElementById('createProposalButton');
const proposalTitleInput = document.getElementById('proposalTitle');
const proposalDescriptionInput = document.getElementById('proposalDescription');
const proposalDurationInput = document.getElementById('proposalDuration');
const proposalsList = document.getElementById('proposalsList');
const proposalResult = document.getElementById('proposalResult');
const votingPowerBreakdown = document.getElementById('votingPowerBreakdown');
const partialUnstakeModal = document.getElementById('partialUnstakeModal');
const closeModalButton = document.querySelector('.close-button');
const totalStakedAmountSpan = document.getElementById('totalStakedAmount');
const partialUnstakeAmountInput = document.getElementById('partialUnstakeAmount');
const confirmPartialUnstakeButton = document.getElementById('confirmPartialUnstake');

let selectedNetwork = 'optimism';
let walletBalance = 0;
let currentUserId = null;
let currentStakeForPartialUnstake = null;
let activeRewardIntervals = [];

auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        authContainer.style.display = 'none';
        stakingContainer.style.display = 'block';

        listenForTVLChanges(); 

        calculateTVLForNetwork(selectedNetwork);
        calculateAndDisplayGlobalEpoch();

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

    calculateTVLForNetwork(selectedNetwork);

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

document.addEventListener("DOMContentLoaded", function () {
    const validatorSelect = document.getElementById("validatorSelect");

    const validatorsList = [
        { value: "", label: "-- Select Validator --", apy: null },
        { value: "mining.js", label: "Mining.js", apy: 50 },
        { value: "ethereum.org", label: "Ethereum", apy: 5 },
        { value: "optimism.org", label: "Optimism", apy: 15 },
        { value: "lido.fi", label: "Lido", apy: 2.9 },
        { value: "coinbase.com", label: "Coinbase", apy: 30 },
        { value: "solanabeach.io", label: "SolanaBeach", apy: 20 }
    ];

    validatorSelect.innerHTML = "";
    validatorsList.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.value;
        opt.textContent = v.label;
        validatorSelect.appendChild(opt);
    });

    window.validatorsList = validatorsList;
});

stakeButton.addEventListener('click', () => {
    const selectedValidator = validatorSelect.value;
    const validatorObj = window.validatorsList.find(v => v.value === selectedValidator);
    const apy = validatorObj ? validatorObj.apy : NaN;
    const autoCompound = autoCompoundCheckbox.checked;

    const amount = parseFloat(stakeAmountInput.value);

    if (!selectedValidator || isNaN(apy)) {
        stakingResult.textContent = 'Please select a valid validator.';
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        stakingResult.textContent = 'Invalid amount.';
        return;
    }
    if (amount > walletBalance) {
        stakingResult.textContent = 'Insufficient balance for staking.';
        return;
    }

    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);
    gasFeeRef.once('value').then(snapshot => {
        const gasFee = snapshot.val() || 0;
        const confirmStake = `Are you sure you want to stake ${amount} ${selectedNetwork} with validator ${selectedValidator}?\n\ngasfee: ${gasFee} ${selectedNetwork}`;
        if (!confirm(confirmStake)) {
            alert('Stake canceled.');
            return;
        }

        const userId = auth.currentUser.uid;
        const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`).push();
        const now = new Date();
        const end = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); 

        stakehash = generateStakeId();
        const stakeData = {
            amount: amount,
            sender: userId,
            recipient: userId,
            amountReceived: amount,
            memo: selectedValidator,
            startTime: now.toISOString(),
            endTime: end.toISOString(),
            validator: selectedValidator,
            stakeId: stakehash,
            apy: apy, 
            gasFee: gasFee,
            autoCompound: autoCompound,
            lastClaimTimestamp: now.toISOString()
        };

        const balanceRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        const dummyRef = database.ref(`wallets/gb0AY8RE8rMYhvywAfYao8Gf3Ai2/${selectedNetwork}/balance`);

        const newBalance = walletBalance - amount - gasFee;

        balanceRef.set(newBalance).then(() => {
            dummyRef.once('value').then(snapshot => {
                const dummyBalance = snapshot.val() || 0;
                dummyRef.set(dummyBalance + amount).then(() => {
                    stakeRef.set(stakeData).then(() => {
                        const transactionHash = generateTransactionHash();
                        const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                        const transactionData = {
                            type: 'stake', amount: amount, sender: userId, recipient: 'gb0AY8RE8rMYhvywAfYao8Gf3Ai2',
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
    });
});

function unstake(stakeId) {
    const userId = auth.currentUser.uid;
    const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
    const dummyRef = database.ref(`wallets/gb0AY8RE8rMYhvywAfYao8Gf3Ai2/${selectedNetwork}/balance`);
    const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

    stakeRef.once('value', stakeSnapshot => {
        const stake = stakeSnapshot.val();
        if (!stake) {
            alert('Stake not found.');
            return;
        }

        getGasFee(gasFee => {
            userRef.once('value', balanceSnapshot => {
                const userBalance = balanceSnapshot.val() || 0;
                let totalReturn = stake.amount;
                let reward = 0;
                const now = new Date();
                const endTime = new Date(stake.endTime);

                if (now > endTime) {
                    const startTime = new Date(stake.startTime);
                    const elapsedDays = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
                    reward = calculateReward(stake.amount, elapsedDays, stake.apy);
                    totalReturn += reward;
                }

                dummyRef.once('value').then(snapshot => {
                    const dummyBalance = snapshot.val() || 0;
                    if (dummyBalance < totalReturn) {
                        alert("The contract does not have enough balance to pay the unstake.");
                        return;
                    }

                    const confirmMessage = `Unstake ${stake.amount.toFixed(8)} + ${reward.toFixed(8)} = ${totalReturn.toFixed(8)} ${selectedNetwork.toUpperCase()}\nGas Fee: ${gasFee}`;
                    if (!confirm(confirmMessage)) return;

                    stakeRef.remove().then(() => {
                        dummyRef.set(dummyBalance - totalReturn).then(() => {
                            userRef.set(userBalance - gasFee + totalReturn).then(() => {
                                const transactionHash = generateTransactionHash();
                                const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                                const transactionData = {
                                    type: 'unstake',
                                    amount: totalReturn,
                                    sender: 'gb0AY8RE8rMYhvywAfYao8Gf3Ai2',
                                    recipient: userId,
                                    amountReceived: totalReturn,
                                    network: selectedNetwork,
                                    gasFee: gasFee,
                                    timestamp: new Date().toISOString(),
                                    memo: `Unstaked from ${stakehash}`,
                                    status: 'success',
                                    hash: transactionHash
                                };
                                transactionRef.set(transactionData).then(() => {
                                    alert('Unstake berhasil!');
                                    loadCurrentStakes(userId);
                                    updateVotingPower(userId);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function openPartialUnstakeModal(stakeId, totalAmount) {
    currentStakeForPartialUnstake = { stakeId, totalAmount };
    totalStakedAmountSpan.textContent = totalAmount;
    partialUnstakeAmountInput.value = '';
    partialUnstakeModal.style.display = 'block';
    partialUnstakeAmountInput.style.color = '#fff';
}

closeModalButton.onclick = function() {
    partialUnstakeModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == partialUnstakeModal) {
        partialUnstakeModal.style.display = "none";
    }
}

confirmPartialUnstakeButton.addEventListener('click', () => {
    const amountToUnstake = parseFloat(partialUnstakeAmountInput.value);
    const { stakeId, totalAmount } = currentStakeForPartialUnstake;

    if (isNaN(amountToUnstake) || amountToUnstake <= 0 || amountToUnstake >= totalAmount) {
        alert('Invalid amount. Amount must be greater than zero and less than the total stake.');
        return;
    }

    const userId = auth.currentUser.uid;
    if (!userId) return;

    getGasFee(gasFee => {
        const userBalanceRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        const dummyRef = database.ref(`wallets/gb0AY8RE8rMYhvywAfYao8Gf3Ai2/${selectedNetwork}/balance`);
        const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);

        Promise.all([
            userBalanceRef.once('value'),
            dummyRef.once('value'),
            stakeRef.once('value')
        ]).then(([userBalSnap, dummySnap, stakeSnap]) => {
            const currentBalance = userBalSnap.val() || 0;
            const dummyBalance = dummySnap.val() || 0;
            const stake = stakeSnap.val();

            if (currentBalance < gasFee) {
                alert('Balance is not sufficient to pay gas fees.');
                return;
            }

            if (dummyBalance < amountToUnstake) {
                alert('Kontrak tidak punya cukup saldo untuk partial unstake.');
                return;
            }

            if (!stake) {
                alert('Stake not ditemukan.');
                return;
            }

            if (confirm(`Unstake ${amountToUnstake} ${selectedNetwork.toUpperCase()}?\nGas Fee: ${gasFee}`)) {
                const remainingAmount = totalAmount - amountToUnstake;
                const newUserBalance = currentBalance + amountToUnstake - gasFee;
                const newDummyBalance = dummyBalance - amountToUnstake;

                stakeRef.update({ amount: remainingAmount }).then(() => {
                    Promise.all([
                        userBalanceRef.set(newUserBalance),
                        dummyRef.set(newDummyBalance)
                    ]).then(() => {
                        const transactionHash = generateTransactionHash();
                        const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                        stakehash = generateStakeId();
                        const transactionData = {
                            type: 'partial_unstake',
                            amount: amountToUnstake,
                            sender: 'gb0AY8RE8rMYhvywAfYao8Gf3Ai2',
                            recipient: userId,
                            amountReceived: amountToUnstake,
                            network: selectedNetwork,
                            gasFee: gasFee,
                            timestamp: new Date().toISOString(),
                            memo: `Partially unstaked from ${stakeId}`,
                            status: 'success',
                            hash: transactionHash
                        };

                        transactionRef.set(transactionData).then(() => {
                            alert('Partial unstake successful!');
                            partialUnstakeModal.style.display = 'none';
                            loadCurrentStakes(userId);
                            updateVotingPower(userId);
                        });
                    });
                }).catch(error => {
                    alert(`Error saat partial unstake: ${error.message}`);
                });
            }
        });
    });
});


function claimReward(stakeId, autoCompound) {
    const userId = auth.currentUser.uid;
    const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
    const dummyRef = database.ref(`wallets/gb0AY8RE8rMYhvywAfYao8Gf3Ai2/${selectedNetwork}/balance`);

    getGasFee(gasFee => {
        userRef.once('value', balanceSnapshot => {
            const userBalance = balanceSnapshot.val() || 0;
            stakeRef.once('value', stakeSnapshot => {
                const stake = stakeSnapshot.val();
                if (!stake) return alert("Stake not found.");

                const now = new Date();
                const endTime = new Date(stake.endTime);
                if (endTime > now) return alert("Cannot claim before lock period ends.");

                const lastClaimTime = new Date(stake.lastClaimTimestamp || stake.startTime);
                const elapsedDays = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60 * 24);
                if (elapsedDays <= 0) return alert("No new rewards.");

                const reward = calculateReward(stake.amount, elapsedDays, stake.apy);

                dummyRef.once('value').then(snapshot => {
                    const dummyBalance = snapshot.val() || 0;
                    if (dummyBalance < reward) return alert("Contract doesn't have enough reward balance.");

                    const confirmMsg = `Claim reward ${reward.toFixed(8)} ${selectedNetwork.toUpperCase()}\nGas: ${autoCompound ? 0 : gasFee}`;
                    if (!confirm(confirmMsg)) return;

                    const updates = { lastClaimTimestamp: now.toISOString() };
                    if (autoCompound) {
                        updates.amount = stake.amount + reward;
                        dummyRef.set(dummyBalance - reward).then(() => {
                            stakeRef.update(updates).then(() => {
                                alert("Reward compounded.");
                                loadCurrentStakes(userId);
                            });
                        });
                    } else {
                        const newUserBalance = userBalance + reward - gasFee;
                        dummyRef.set(dummyBalance - reward).then(() => {
                            userRef.set(newUserBalance).then(() => {
                                stakeRef.update(updates).then(() => {
                                    const transactionHash = generateTransactionHash();
                                    const txRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                                    const txData = {
                                        type: 'claim',
                                        amount: reward,
                                        sender: 'gb0AY8RE8rMYhvywAfYao8Gf3Ai2',
                                        recipient: userId,
                                        amountReceived: reward,
                                        network: selectedNetwork,
                                        gasFee: gasFee,
                                        timestamp: now.toISOString(),
                                        memo: `Claimed Reward ${reward}`,
                                        status: 'success',
                                        hash: transactionHash
                                    };
                                    txRef.set(txData).then(() => {
                                        alert("Reward claimed!");
                                        loadCurrentStakes(userId);
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    });
}


function calculateReward(amount, durationInDays, apy) {
    return amount * (apy / 100) * (durationInDays / 365);
}

function updateEstimatedReward() {
    const amount = parseFloat(stakeAmountInput.value);
    const selectedValidator = validatorSelect.value;
const validatorObj = window.validatorsList.find(v => v.value === selectedValidator);
const apy = validatorObj ? validatorObj.apy : NaN;

    
    if (!isNaN(amount) && amount > 0 && !isNaN(apy)) {
        const estimatedReward = calculateReward(amount, 1, apy);
        document.getElementById('estimatedReward').textContent = estimatedReward.toFixed(10);
    } else {
        document.getElementById('estimatedReward').textContent = '0.0000';
    }
}

stakeAmountInput.addEventListener('input', updateEstimatedReward);

validatorSelect.addEventListener('change', () => {
    const selectedValidator = validatorSelect.value;
const validatorObj = window.validatorsList.find(v => v.value === selectedValidator);
const apy = validatorObj ? validatorObj.apy : null;

    
    if (apy) {
        document.getElementById('currentApyDisplay').textContent = `APY: ${apy}%`;
    } else {
        document.getElementById('currentApyDisplay').textContent = 'APY: -';
    }
    updateEstimatedReward();
});

function startCountdown(endTime, element, stake, networkTicker) {
    const countdownInterval = setInterval(() => {
        const now = new Date();
        const timeDiff = new Date(endTime) - now;

        if (timeDiff <= 0) {
            clearInterval(countdownInterval); 
            const updateRewardDisplay = () => {
                const rightNow = new Date();
                const lastClaimPoint = new Date(stake.lastClaimTimestamp || stake.startTime);
                const elapsedDays = (rightNow.getTime() - lastClaimPoint.getTime()) / (1000 * 60 * 60 * 24);
                const reward = calculateReward(stake.amount, elapsedDays, stake.apy);
                
                element.textContent = `Rewards you haven't claimed yet: ${reward.toFixed(8)} ${networkTicker.toUpperCase()}`;
                element.style.color = '#ffffff';
                element.style.fontWeight = 'bold';
            };

            updateRewardDisplay();
            const rewardInterval = setInterval(updateRewardDisplay, 5000);
            activeRewardIntervals.push(rewardInterval);

            return;
        }
    const d = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeDiff % (1000 * 60)) / 1000);
        element.textContent = `Next Reward in: ${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
}

let globalEpochNumber = 1;

function calculateAndDisplayGlobalEpoch() {
    const genesisDate = new Date('2025-08-01T00:00:00Z');
    const now = new Date();
    const diffTime = Math.abs(now - genesisDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    globalEpochNumber = diffDays + 1;

    const epochDisplayElement = document.getElementById('globalEpochDisplay');
    if (epochDisplayElement) {
        epochDisplayElement.textContent = globalEpochNumber;
    }
}

function loadCurrentStakes(userId) {
    activeRewardIntervals.forEach(clearInterval);
    activeRewardIntervals = [];

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
                    <p><strong>Validator:</strong> ${stake.validator || 'Unknown'} | <strong>APY:</strong> ${stake.apy || '-'}% ${stake.autoCompound ? '| <strong style="color:skyblue;">Auto-Stake Rewards</strong>' : ''}</p>
                    <p><strong>Amount:</strong> ${stake.amount.toFixed(8)}</p>
                    <p><strong>Epoch:</strong> ${globalEpochNumber}</p>
                    <p><strong>Initial End Date:</strong> ${formatDateToIndonesian(stake.endTime)}</p>
                `;
                stakeElement.appendChild(countdownElement);
                
                const unstakeBtn = document.createElement('button');
                unstakeBtn.textContent = 'Unstake';
                unstakeBtn.onclick = () => unstake(stakeId);
                stakeElement.appendChild(unstakeBtn);

                const partialUnstakeBtn = document.createElement('button');
                partialUnstakeBtn.textContent = 'Partial Unstake';
                partialUnstakeBtn.onclick = () => openPartialUnstakeModal(stakeId, stake.amount);
                stakeElement.appendChild(partialUnstakeBtn);

                const claimBtn = document.createElement('button');
                claimBtn.textContent = 'Claim';
                claimBtn.onclick = () => claimReward(stakeId, stake.autoCompound);
                stakeElement.appendChild(claimBtn);
                
                currentStakes.appendChild(stakeElement);
                startCountdown(stake.endTime, countdownElement, stake, selectedNetwork);
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
}

function generateTransactionHash() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

function generateStakeId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let hash = 'stk';
    for (let i = 0; i < 64; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

function updateGovernanceUIState() {
    const isOptimism = selectedNetwork === 'optimism';

    proposalTitleInput.disabled = !isOptimism;
    proposalDescriptionInput.disabled = !isOptimism;
    proposalDurationInput.disabled = !isOptimism;
    createProposalButton.disabled = !isOptimism;

    if (!isOptimism) {
        proposalTitleInput.placeholder = "Only active on the Optimism network";
        proposalResult.textContent = "Governance is only available on the Optimism network.";
    } else {
        proposalTitleInput.placeholder = "Proposal Title";
        proposalResult.textContent = "";
    }

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
                if (proposal.network === 'optimism') {
                    displayProposal(proposalId, proposal);
                }
            });
        } else {
            proposalsList.innerHTML = '<p>No active proposals on Optimism network.</p>';
        }
        updateGovernanceUIState();
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

    const deadline = proposal.createdAt + (proposal.durationHours * 60 * 60 * 1000);
    const isExpired = new Date().getTime() > deadline;
    let status = 'pending';
    if (isExpired) {
        status = votesFor > votesAgainst ? 'succeeded' : 'failed';
    } else if (proposal.createdAt < new Date().getTime()) {
        status = 'active';
    }

    proposalElement.innerHTML = `
        <h4>${proposal.title} <span class="proposal-status ${status}">${status}</span></h4>
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
        const interval = setInterval(() => {
            const now = new Date();
            const timeDiff = new Date(deadline) - now;
            if (timeDiff <= 0) {
                countdownElement.textContent = 'Voting has ended.';
                clearInterval(interval);
                return;
            }
            const d = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const h = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((timeDiff % (1000 * 60)) / 1000);
            countdownElement.textContent = `${d}d ${h}h ${m}m ${s}s`;
        }, 1000);
    }
}

function getStakedAmountForNetwork(userId, network, callback) {
    const stakesRef = database.ref(`wallets/${userId}/${network}/staking`);
    stakesRef.once('value', stakeSnapshot => {
        let networkStaked = 0;
        stakeSnapshot.forEach(childSnapshot => {
            const stake = childSnapshot.val();
            if (stake && stake.amount) {
                networkStaked += stake.amount;
            }
        });
        callback(networkStaked);
    });
}

createProposalButton.addEventListener('click', () => {
    if (selectedNetwork !== 'optimism') {
        proposalResult.textContent = 'Proposal creation can only be done on the Optimism network.';
        return;
    }

    const title = proposalTitleInput.value;
    const description = proposalDescriptionInput.value;
    const durationHours = parseInt(proposalDurationInput.value, 10);

    if (!title || !description || isNaN(durationHours) || durationHours <= 0) {
        proposalResult.textContent = 'Title, description, and a valid duration are required.';
        return;
    }

    const minStakeToPropose = 100;

    getStakedAmountForNetwork(currentUserId, 'optimism', (stakedAmount) => {
        if (stakedAmount < minStakeToPropose) {
            proposalResult.textContent = `You need at least ${minStakeToPropose} staked OP to create a proposal. Your current staked amount is ${stakedAmount.toFixed(4)} OP.`;
            return;
        }

        const proposalId = generateTransactionHash();
        const newProposal = {
            proposerId: currentUserId,
            title,
            description,
            network: 'optimism',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            durationHours: durationHours,
            status: 'pending'
        };

        database.ref(`proposals/${proposalId}`).set(newProposal)
            .then(() => {
                proposalResult.textContent = 'Proposal created successfully!';
                proposalTitleInput.value = '';
                proposalDescriptionInput.value = '';
                proposalDurationInput.value = '';
            }).catch(error => proposalResult.textContent = `Error: ${error.message}`);
    });
});


function castVote(proposalId, choice) {
    if (!currentUserId) {
        alert('Please connect your wallet to vote.');
        return;
    }

    if (selectedNetwork !== 'optimism') {
        alert('Voting can only be done on the Optimism network.');
        return;
    }

    const proposalRef = database.ref(`proposals/${proposalId}`);
    const resultEl = document.getElementById(`vote-result-${proposalId}`);

    proposalRef.once('value').then(proposalSnapshot => {
        const proposal = proposalSnapshot.val();
        if (!proposal) {
            resultEl.textContent = 'Proposal not found.';
            return;
        }

        const deadline = proposal.createdAt + (proposal.durationHours * 60 * 60 * 1000);
        if (new Date().getTime() > deadline) {
            resultEl.textContent = 'The voting period for this proposal has ended.';
            const buttons = resultEl.closest('.proposal').querySelectorAll('.vote-button');
            buttons.forEach(b => b.disabled = true);
            return;
        }

        const voteRef = database.ref(`proposals/${proposalId}/votes/${currentUserId}`);
        const userBalanceRef = database.ref(`wallets/${currentUserId}/${selectedNetwork}/balance`);

        getGasFee(gasFee => {
            if (walletBalance < gasFee) {
                resultEl.textContent = 'Balance is not sufficient to pay gas fees.';
                return;
            }

            if (!confirm(`Are you sure you want to vote '${choice}'? This will cost you a gas fee of ${gasFee} OP.`)) {
                resultEl.textContent = 'Vote canceled.';
                return;
            }

            voteRef.once('value', snapshot => {
                if (snapshot.exists()) {
                    resultEl.textContent = 'You have already voted on this proposal.';
                    return;
                }

                Rollup(currentUserId, totalStaked => {
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
                                recipient: 'gb0AY8RE8rMYhvywAfYao8Gf3Ai2',
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
    const elements = document.querySelectorAll('nav, .wallet-details, .stake-form, .governance-section, .modal-content');
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

function Rollup(userId, callback) {
    let totalVotingPower = 0;
    const networksRef = database.ref(`wallets/${userId}`);
    networksRef.once('value', snapshot => {
        const networks = snapshot.val();
        let networksProcessed = 0;
        const totalNetworks = snapshot.numChildren();
        if (!totalNetworks) {
            callback(0, {});
            return;
        }
        const powerBreakdown = {};
        for (const network in networks) {
            const stakesRef = database.ref(`wallets/${userId}/${network}/staking`);
            stakesRef.once('value', stakeSnapshot => {
                let networkStaked = 0;
                stakeSnapshot.forEach(childSnapshot => {
                    const stake = childSnapshot.val();
                    if (stake) {
                        networkStaked += stake.amount;
                    }
                });
                if(networkStaked > 0) {
                    powerBreakdown[network] = networkStaked;
                }
                totalVotingPower += networkStaked;
                networksProcessed++;
                if (networksProcessed === totalNetworks) {
                    callback(totalVotingPower, powerBreakdown);
                }
            });
        }
    });
}

function updateVotingPower(userId) {
    Rollup(userId, (totalStaked, breakdown) => {
        document.getElementById('votingPower').textContent = totalStaked.toFixed(4);
        let breakdownHTML = '';
        for (const network in breakdown) {
            breakdownHTML += `<p>${network}: ${breakdown[network].toFixed(4)}</p>`;
        }
        votingPowerBreakdown.innerHTML = breakdownHTML;
    });
}

autoCompoundCheckbox.addEventListener('change', () => {
    if (autoCompoundCheckbox.checked) {
        alert("Auto-Stake Rewards is ENABLED. Your rewards will be automatically added to your stake, increasing your principal amount over time. No gas fees will be charged for compounding.");
    } else {
        alert("Auto-Stake Rewards is DISABLED. Your rewards will be accumulated but not automatically added to your stake. You will need to manually claim rewards, which will incur a gas fee.");
    }
});

function listenForTVLChanges() {
    const walletsRef = database.ref('wallets');
    const tvlValueElement = document.getElementById('tvlValue');

    walletsRef.on('value', (snapshot) => {
        let totalTVL = 0;
        snapshot.forEach((userSnapshot) => {
            userSnapshot.forEach((networkSnapshot) => {
                const stakingNode = networkSnapshot.child('staking');
                stakingNode.forEach((stakeSnapshot) => {
                    const stake = stakeSnapshot.val();
                    if (stake && typeof stake.amount === 'number') {
                        totalTVL += stake.amount;
                    }
                });
            });
        });

        tvlValueElement.textContent = totalTVL.toLocaleString('en-US', { 
            minimumFractionDigits: 4, 
            maximumFractionDigits: 4 
        });
    }, (error) => {
        console.error("Gagal membaca data TVL:", error);
        tvlValueElement.textContent = "Error";
    });
}

let tvlListener = null;

/**
 * Fungsi ini MENGHITUNG TVL untuk JARINGAN TERTENTU pada satu waktu.
 * @param {string} network - Nama jaringan yang akan dihitung.
 */
function calculateTVLForNetwork(network) {
    const walletsRef = database.ref('wallets');
    const tvlValueElement = document.getElementById('tvlValue');
    const networkTicker = network.toUpperCase();

    tvlValueElement.textContent = 'Calculating...';
    if (tvlListener) {
        walletsRef.off('value', tvlListener);
    }
    tvlListener = walletsRef.on('value', (snapshot) => {
        let networkTotalTVL = 0;
        
        snapshot.forEach((userSnapshot) => {
            if (userSnapshot.hasChild(network)) {
                const stakingNode = userSnapshot.child(`${network}/staking`);
                stakingNode.forEach((stakeSnapshot) => {
                    const stake = stakeSnapshot.val();
                    if (stake && typeof stake.amount === 'number') {
                        networkTotalTVL += stake.amount;
                    }
                });
            }
        });

        tvlValueElement.textContent = `${networkTotalTVL.toLocaleString('en-US', { 
            minimumFractionDigits: 4, 
            maximumFractionDigits: 4 
        })} ${networkTicker}`;
    }, (error) => {
        console.error(`Gagal membaca data TVL untuk ${network}:`, error);
        tvlValueElement.textContent = "Error";
    });
}
