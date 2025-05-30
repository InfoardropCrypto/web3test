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
const unstakeButton = document.getElementById('unstakeButton');
const networkSelect = document.getElementById('networkSelect');

const networkTickers = {
    eth: 'ETH',
    steth: 'ETH',
    optimism: 'OP'
};

// Event listener untuk ganti network
networkSelect.addEventListener('change', (event) => {
    selectedNetwork = event.target.value;
    selectedNetworkDisplay.textContent = selectedNetwork.toUpperCase(); // Update tampilan jaringan
    loadWalletDetails(auth.currentUser.uid); // Muat ulang detail wallet sesuai dengan jaringan yang dipilih
    loadCurrentStakes(auth.currentUser.uid); // Muat ulang staking sesuai dengan jaringan yang dipilih
});

// Update fungsi loadWalletDetails
function loadWalletDetails(userId) {
    const networkPath = `wallets/${userId}/${selectedNetwork}`;

    // Load Address
    database.ref(`${networkPath}/address`).once('value', snapshot => {
        walletAddressDisplay.textContent = snapshot.val() || 'Please Add Network On Wallet';
    });

   // Load Balance
database.ref(`${networkPath}/balance`).once('value', snapshot => {
    walletBalance = snapshot.val() || 0;

    // Format balance dengan 8 angka desimal dan tanda koma
    const formattedBalance = walletBalance.toLocaleString('en-US', { 
        minimumFractionDigits: 8, 
        maximumFractionDigits: 8 
    });

    walletBalanceDisplay.textContent = formattedBalance;
});


    // Display Network
    selectedNetworkDisplay.textContent = selectedNetwork.toUpperCase();
}

function loadCurrentStakes(userId) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);

    stakesRef.once('value', snapshot => {
        const stakes = snapshot.val();
        currentStakes.innerHTML = '';

        if (stakes) {
            Object.keys(stakes).forEach(stakeId => {
                const stake = stakes[stakeId];
                const stakeElement = document.createElement('div');
                stakeElement.innerHTML = `
                    Amount: ${stake.amount} <br>
                    Duration: ${stake.duration} days <br>
                    Start Time: ${formatDateToIndonesian(stake.startTime)} <br>
                    End Time: ${formatDateToIndonesian(stake.endTime)} <br>
                    ${stake.claimed ? `Claim Time: ${formatDateToIndonesian(stake.claimTime)}` : 'Not Claimed Yet'}
                `;
                
                // Add Unstake button
                const unstakeBtn = document.createElement('button');
                unstakeBtn.textContent = 'Unstake';
                unstakeBtn.addEventListener('click', () => unstake(stakeId, stake.amount));
                stakeElement.appendChild(unstakeBtn);
                
                // Add Claim Reward button
                const claimBtn = document.createElement('button');
                claimBtn.textContent = 'Claim';
                claimBtn.addEventListener('click', () => claimReward(stakeId, stake.amount));
                stakeElement.appendChild(claimBtn);

                currentStakes.appendChild(stakeElement);
            });
        } else {
            currentStakes.textContent = 'No current stakes found.';
        }
    });
}


let selectedNetwork = 'steth';  // Network
let walletBalance = 0;

auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        stakingContainer.style.display = 'block';
        loadCurrentStakes(user.uid);
        loadWalletDetails(user.uid);
        autoDistributeRewards(user.uid); // <-- Tambahkan ini
    } else {
        authContainer.style.display = 'block';
        stakingContainer.style.display = 'none';
    }
});

// Format Date for Indonesia
function formatDateToIndonesian(date) {
    if (!date || isNaN(new Date(date).getTime())) {
        return 'Invalid date'; // Return a default message for invalid dates
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

const validatorSelect = document.getElementById('validatorSelect');

stakeButton.addEventListener('click', () => {
    const amount = parseFloat(stakeAmountInput.value);
    const duration = parseInt(stakeDurationInput.value);
    const sender = parseInt (stakeAmountInput.value);
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

    // Ambil gasFee dari Firebase
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
            amount: amount,
            duration: duration,
            sender: userId,
            recipient: userId,
            amountReceived: amount,
            memo: selectedValidator,
            startTime: now.toISOString(),
            endTime: end.toISOString(),
            claimed: false,
            claimTime: null,
            validator: selectedValidator,
            apy: apy,
            gasFee: gasFee
        };

        const newBalance = walletBalance - amount - gasFee;

        const balanceRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

        balanceRef.set(newBalance).then(() => {
            stakeRef.set(stakeData).then(() => {
                // Menghasilkan hash acak saat transaksi staking
const transactionHash = generateTransactionHash();

// Setelah memastikan staking berhasil, simpan transaksi dengan hash acak
const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
const transactionData = {
    type: 'stake',
    amount: amount,
    sender: userId,
    recipient: '00000000O0000000000O00000000',
    amountReceived: amount,
    network: selectedNetwork,
    validator: selectedValidator,
    apy: apy,
    gasFee: gasFee,
    timestamp: new Date().toISOString(),
    memo: selectedValidator,
    status: 'success',
    hash: transactionHash  // Menyimpan hash acak
};

// Menyimpan transaksi dengan hash acak
transactionRef.set(transactionData).then(() => {
    stakingResult.textContent = 'Staking successful!';
    walletBalance = newBalance;
    walletBalanceDisplay.textContent = walletBalance.toFixed(4);
    loadCurrentStakes(userId);
}).catch(error => {
    console.error('Error saving transaction:', error);
});


                transactionRef.set(transactionData).then(() => {
                    stakingResult.textContent = 'Staking successful!';
                    walletBalance = newBalance;
                    walletBalanceDisplay.textContent = walletBalance.toFixed(4);
                    loadCurrentStakes(userId);
                }).catch(error => {
                    console.error('Error saving transaction:', error);
                });
            }).catch(error => {
                console.error('Error staking:', error);
                stakingResult.textContent = 'Error staking. Please try again.';
            });
        }).catch(error => {
            console.error('Error updating balance:', error);
            stakingResult.textContent = 'Error updating balance. Please try again.';
        });

    }).catch(error => {
        console.error('Error fetching gas fee:', error);
        stakingResult.textContent = 'Gagal mengambil data gas fee.';
    });
});

function generateTransactionHash() {
    return crypto.getRandomValues(new Uint8Array(32)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function unstake(stakeId, amount) {
    const userId = firebase.auth().currentUser.uid;

    getGasFee(gasFee => {
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

        userRef.once('value', snapshot => {
            const balance = snapshot.val();

            if (balance >= gasFee) {
                const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
                stakeRef.once('value', snapshot => {
                    const stake = snapshot.val();

                    if (stake) {
                        if (confirm(`Are you sure you want to unstake ${amount}? This will incur a gas fee of ${gasFee}.`)) {
                            const newBalance = balance - gasFee + amount;

                            stakeRef.remove().then(() => {
                                userRef.set(newBalance).then(() => {
                                    walletBalance = newBalance;
                                    walletBalanceDisplay.textContent = walletBalance.toFixed(4);

                                    const transactionHash = generateTransactionHash();
                                    const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                                    const transactionData = {
                                        type: 'unstake',
                                        amount: amount,
                                        sender: '00000000O0000000000O00000000',
    recipient: userId,
    amountReceived: amount,
                                        network: selectedNetwork,
                                        gasFee: gasFee,
                                        timestamp: new Date().toISOString(),
                                        memo: 'Unstaked!',
                                        status: 'success',
                                        hash: transactionHash
                                    };

                                    transactionRef.set(transactionData).then(() => {
                                        alert('Unstaked successfully! Tokens have been returned to your wallet.');
                                        loadCurrentStakes(userId);
                                    }).catch(error => {
                                        console.error('Error saving transaction:', error);
                                    });
                                }).catch(error => {
                                    console.error('Error updating balance:', error);
                                });
                            }).catch(error => {
                                console.error('Error unstaking:', error);
                            });
                        } else {
                            alert('Unstake canceled.');
                        }
                    } else {
                        alert('Staking data not found.');
                    }
                });
            } else {
                alert('Insufficient balance for gas fee.');
            }
        });
    });
}


function claimReward(stakeId, amount) {
    const userId = firebase.auth().currentUser.uid;
    
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
                        const endTime = new Date(stake.endTime);

                        if (now < endTime) {
                            alert('Reward cannot be claimed before the staking period ends.');
                            return;
                        }

                        if (stake.claimed) {
                            alert('Reward has already been claimed.');
                            return;
                        }

                        const reward = calculateReward(stake.amount, stake.duration, stake.apy);

                        if (confirm(`Are you sure you want to claim your reward? ${reward} This will incur a gas fee of ${gasFee}.`)) {
                            stakeRef.update({
                                claimed: true,
                                claimTime: now.toISOString()
                            }).then(() => {
                                const newBalance = balance + reward - gasFee;
                                userRef.set(newBalance).then(() => {
                                    walletBalance = newBalance;
                                    walletBalanceDisplay.textContent = walletBalance.toFixed(4);
                       const transactionHash = generateTransactionHash();
                       
                       const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                    const transactionData = {
                        type: 'claim',
                        amount: reward,
                        sender: '00000000O0000000000O00000000',
                        recipient: userId,
                        amountReceived: reward,
                        network: selectedNetwork,
                        gasFee: gasFee,
                        timestamp: now.toISOString(),
                        memo: 'Claimed $',
                        status: 'success',
                        hash: transactionHash
                    };

                                    transactionRef.set(transactionData).then(() => {
                                        alert('Reward claimed successfully!');
                                        loadCurrentStakes(userId);
                                    }).catch(error => {
                                        console.error('Error saving transaction:', error);
                                    });
                                }).catch(error => {
                                    console.error('Error updating balance:', error);
                                    alert('Error updating balance. Please try again.');
                                });
                            }).catch(error => {
                                console.error('Error claiming reward:', error);
                                alert('Error claiming reward. Please try again.');
                            });
                        } else {
                            alert('Claim canceled.');
                        }
                    } else {
                        alert('Staking data not found.');
                    }
                });
            } else {
                alert('Insufficient balance for gas fee.');
            }
        });
    });
}

function calculateReward(amount, duration, apy) {
    const reward = amount * (apy / 100) * (duration / 365);
    return reward;
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

// Event listeners for amount and duration inputs
stakeAmountInput.addEventListener('input', updateEstimatedReward);
stakeDurationInput.addEventListener('input', updateEstimatedReward);

// Update countdown function
function startCountdown(endTime, element) {
    function updateCountdown() {
        const now = new Date();
        const end = new Date(endTime);
        const timeDiff = end - now;

        if (timeDiff <= 0) {
            element.textContent = '00:00:00:00'; // DD:HH:MM:SS
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);

        const formatted = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        element.textContent = formatted;
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// Load Current Stakes with Countdown
function loadCurrentStakes(userId) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);

    stakesRef.once('value', snapshot => {
        const stakes = snapshot.val();
        currentStakes.innerHTML = '';

        if (stakes) {
            Object.keys(stakes).forEach(stakeId => {
                const stake = stakes[stakeId];
                const stakeElement = document.createElement('div');
                
                // Create countdown container
                const countdownElement = document.createElement('div');
                countdownElement.classList.add('countdown');
                stakeElement.appendChild(countdownElement);

                stakeElement.innerHTML = `
    APY: ${stake.apy || '-'}% <br>
    Amount: ${stake.amount} <br>
    Validator: ${stake.validator || 'Unknown'} <br>
    Duration: ${stake.duration} days <br>
    Start Time: ${formatDateToIndonesian(stake.startTime)} <br>
    End Time: ${formatDateToIndonesian(stake.endTime)} <br>
    ${stake.claimed ? `Claim Time: ${formatDateToIndonesian(stake.claimTime)}` : 'Not Claimed Yet'}
`;

                // Add Unstake button for each stake
                const unstakeBtn = document.createElement('button');
                unstakeBtn.textContent = 'Unstake';
                unstakeBtn.addEventListener('click', () => unstake(stakeId, stake.amount));
                stakeElement.appendChild(unstakeBtn);
                
                // Add Claim Reward button for each stake
                const claimBtn = document.createElement('button');
                claimBtn.textContent = 'Claim';
                claimBtn.addEventListener('click', () => claimReward(stakeId, stake.amount));
                stakeElement.appendChild(claimBtn);

                currentStakes.appendChild(stakeElement);

                // Start countdown
                startCountdown(stake.endTime, countdownElement);
            });
        } else {
            currentStakes.textContent = 'No current stakes found —_—.';
        }
    });
}

// Get Gas Fee for the selected network
function getGasFee(callback) {
    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);
    
    gasFeeRef.once('value', snapshot => {
        const gasFee = snapshot.val();
        if (callback) {
            callback(gasFee);
        }
    });
}

// Example stake function with gas fee
function stake(amount) {
    const userId = firebase.auth().currentUser.uid;

    getGasFee(gasFee => {
        const totalAmount = amount + gasFee;
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        
        userRef.once('value', snapshot => {
            const balance = snapshot.val();

            if (balance >= totalAmount) {
                if (confirm(`Are you sure you want to stake ${amount}? This will incur a gas fee of ${gasFee}.`)) {
                    const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`).push();
                    const now = new Date();

                    stakeRef.set({
                        amount: amount,
                        duration: 30, // Example duration
                        startTime: now.toISOString(),
                        endTime: new Date(now.getTime() + 30*24*60*60*1000).toISOString(), // End time after 30 days
                        claimed: false,
                        claimTime: null
                    }).then(() => {
                        userRef.set(balance - totalAmount); // Deduct balance including gas fee
                        alert('Staking successful!');
                        loadCurrentStakes(userId); // Refresh stakes
                    }).catch(error => {
                        console.error('Error staking:', error);
                    });
                } else {
                    alert('Staking canceled.');
                }
            } else {
                alert('Insufficient balance for staking and gas fee.');
            }
        });
    });
}

document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    const elements = document.querySelectorAll('nav, .wallet-details, .stake-form');
    elements.forEach(el => el.classList.toggle('dark-theme'));

    const themeIcon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon'); // Ubah ikon menjadi bulan
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun'); // Ubah ikon menjadi matahari
    }
});

document.addEventListener("DOMContentLoaded", function () {
            const selectElement = document.getElementById("networkSelect");
            const networkIcon = document.getElementById("networkIcon");

            networkIcon.src = selectElement.options[selectElement.selectedIndex].getAttribute('data-image');

            selectElement.addEventListener('change', function () {
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const imgSrc = selectedOption.getAttribute('data-image');
                
                if (imgSrc) {
                    networkIcon.src = imgSrc;
                }
            });
        });

validatorSelect.addEventListener('change', () => {
    const selectedOption = validatorSelect.options[validatorSelect.selectedIndex];
    const apy = selectedOption.dataset.apy;
    document.getElementById('currentApyDisplay').textContent = `Current APY: ${apy}%`;

    updateEstimatedReward(); // hitung ulang reward
});

function autoDistributeRewards(userId) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);
    const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

    stakesRef.once('value', snapshot => {
        const stakes = snapshot.val();
        if (!stakes) return;

        userRef.once('value', balanceSnap => {
            let currentBalance = balanceSnap.val() || 0;

            Object.keys(stakes).forEach(stakeId => {
                const stake = stakes[stakeId];

                const now = new Date();
                const endTime = new Date(stake.endTime);

                // Cek staking sudah berakhir dan belum diklaim
                if (endTime <= now && !stake.claimed) {
                    const reward = calculateReward(stake.amount, stake.duration, stake.apy);
                    const newBalance = currentBalance + reward;

                    // Tandai sebagai diklaim
                    database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`).update({
                        claimed: true,
                        claimTime: now.toISOString()
                    });

                    // Update saldo user
                    currentBalance = newBalance;
                    userRef.set(newBalance);

                    // Simpan ke riwayat transaksi
                    const transactionRef = database.ref(`transactions/allnetwork/${transactionHash}`);
                    const transactionData = {
                        type: 'claim',
                        amount: reward,
                        network: selectedNetwork,
                        gasFee: gasFee,
                        timestamp: now.toISOString(),
                        memo: 'staketypev1',
                        status: 'success',
                        hash: transactionHash
                    };

                    transactionRef.set(transactionData);

                    console.log(`Auto claimed reward for stake ${stakeId}`);
                }
            });

            // Update UI
            walletBalance = currentBalance;
            walletBalanceDisplay.textContent = walletBalance.toFixed(4);
            loadCurrentStakes(userId);
        });
    });
}

function generateTransactionHash() {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) { // Panjang hash 64 karakter (mirip dengan hash blockchain sebenarnya)
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}