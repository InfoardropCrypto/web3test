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

function createTokenSelects() {
    const token1Options = [
        { value: "usdt_sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", text: "USDT_SUI", selected: true },
        { value: "usdc_sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", text: "USDC_SUI" },
        { value: "sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png", text: "Sui Network" },
        { value: "walrus", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36119.png", text: "Walrus" },
        { value: "sol", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", text: "Solana" },
        { value: "pengu", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/34466.png", text: "Pengu" },
        { value: "jup", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png", text: "Jupiter" },
        { value: "cosmos", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3794.png", text: "Cosmos" },
        { value: "haedal", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36369.png", text: "Haedal" },
        { value: "eth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", text: "Ethereum" },
    ];

    const token2Options = [
        { value: "usdt_sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", text: "USDT_SUI" },
        { value: "usdc_sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", text: "USDC_SUI" },
        { value: "sui", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png", text: "Sui Network", selected: true },
        { value: "eth", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", text: "Ethereum" },
        { value: "walrus", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36119.png", text: "Walrus" },
        { value: "sol", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", text: "Solana" },
        { value: "pengu", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/34466.png", text: "Pengu" },
        { value: "jup", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png", text: "Jupiter" },
        { value: "cosmos", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3794.png", text: "Cosmos" },
        { value: "haedal", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/36369.png", text: "Haedal" },
    ];

    function createSelectElement(id, options) {
        const select = document.createElement('select');
        select.id = id;
        select.style.display = 'none';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.dataset.image = opt.image;
            option.textContent = opt.text;
            if (opt.selected) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        return select;
    }
    
    const token1SelectEl = createSelectElement('token1Select', token1Options);
    const token2SelectEl = createSelectElement('token2Select', token2Options);
    document.body.appendChild(token1SelectEl);
    document.body.appendChild(token2SelectEl);
}

document.addEventListener('DOMContentLoaded', () => {
    createTokenSelects();
    initializePage(); 
});

function initializePage() {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();
    const liquidityContainer = document.getElementById('liquidityContainer');
    const authContainer = document.getElementById('authContainer');
    const token1Select = document.getElementById('token1Select');
    const token2Select = document.getElementById('token2Select');
    const token1AmountInput = document.getElementById('token1Amount');
    const token2AmountInput = document.getElementById('token2Amount');
    const token1BalanceDisplay = document.getElementById('token1Balance');
    const token2BalanceDisplay = document.getElementById('token2Balance');
    const lpTokenNameDisplay = document.getElementById('lpTokenName');
    const addLiquidityButton = document.getElementById('addLiquidityButton');
    const currentLiquidity = document.getElementById('currentLiquidity');
    const signInForm = document.getElementById('signInForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    let currentUserId = null;
    let tokenBalances = {};
    let tokenPrices = {};
    let userLpPositions = {}; 

    function showToast(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `${message}<button class="close-button">&times;</button>`;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        const close = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.parentElement?.removeChild(toast), 500);
        };
        
        toast.querySelector('.close-button').addEventListener('click', close);
        setTimeout(close, 5000);
    }

    function showConfirmation(question, onConfirm) {
        if (window.confirm(question.replace(/<br>/g, "\n"))) {
            onConfirm();
        } else {
            showToast('Operation canceled.', 'info');
        }
    }

    function renderLiquidityPositions() {
        currentLiquidity.innerHTML = '<h3>My Positions:</h3>';
        if (!tokenPrices['sui']) {
            currentLiquidity.innerHTML += '<p>Loading token prices...</p>';
            return;
        }

        if (userLpPositions && Object.keys(userLpPositions).length > 0) {
            Object.keys(userLpPositions).forEach(lpTokenName => {
                const positions = userLpPositions[lpTokenName];
                Object.keys(positions).forEach(positionId => {
                    const position = positions[positionId];
                    if (!position || !position.token1) return;

                    const { amount1: initialAmount1, token1, amount2: initialAmount2, token2 } = position;
                    let currentAmount1 = initialAmount1, currentAmount2 = initialAmount2, totalValueUSD = 0;

                    const isSuiStablePool = (token1 === 'sui' && (token2 === 'usdc_sui' || token2 === 'usdt_sui')) ||
                                            (token2 === 'sui' && (token1 === 'usdc_sui' || token1 === 'usdt_sui'));

                    if (isSuiStablePool) {
                        let initialSuiAmount, initialUsdcAmount;
                        if (token1 === 'sui') {
                            initialSuiAmount = initialAmount1;
                            initialUsdcAmount = initialAmount2;
                        } else {
                            initialSuiAmount = initialAmount2;
                            initialUsdcAmount = initialAmount1;
                        }
                        
                        const k = initialSuiAmount * initialUsdcAmount;
                        const currentSuiPrice = tokenPrices['sui'];

                        const newSuiAmount = Math.sqrt(k / currentSuiPrice);
                        const newUsdcAmount = Math.sqrt(k * currentSuiPrice);
                        
                        if (token1 === 'sui') {
                            currentAmount1 = newSuiAmount;
                            currentAmount2 = newUsdcAmount;
                        } else {
                            currentAmount1 = newUsdcAmount;
                            currentAmount2 = newSuiAmount;
                        }
                        totalValueUSD = (newSuiAmount * currentSuiPrice) + newUsdcAmount;

                    } else {
                        const price1 = tokenPrices[position.token1] || 0;
                        const price2 = tokenPrices[position.token2] || 0;
                        totalValueUSD = (initialAmount1 * price1) + (initialAmount2 * price2);
                    }

                    const price1 = tokenPrices[position.token1] || 0;
                    const { rewardAmount, rewardValueUSD } = calculateReward(position, price1);
                    
                    const positionElement = document.createElement('div');
                    positionElement.className = 'liquidity-position';
                    
                    positionElement.innerHTML = `
                        <div class="lp-header">
                            <p><strong>Value:</strong> ~$${totalValueUSD.toFixed(2)}</p>
                        </div>
                        <div class="lp-details">
                            <p style="color: #007bff; font-weight: bold;">${currentAmount1.toFixed(4)} ${position.token1.toUpperCase()} / ${currentAmount2.toFixed(4)} ${position.token2.toUpperCase()}</p>
                            <p class="reward"><strong>Rewards:</strong> ${rewardAmount.toFixed(8)} ${position.token1.toUpperCase()} (~$${rewardValueUSD.toFixed(4)})</p>
                            <p><strong>LP:</strong> ${lpTokenName.replace(/_/g, ' ')}</p>
                        </div>
                        <p class="lp-date"><small>Provided on: ${new Date(position.createdAt).toLocaleString('id-ID')}</small></p>
                        <div class="lp-actions">
                            <button class="claim-button">Claim</button>
                            <button class="remove-button">Remove</button>
                        </div>
                    `;

                    positionElement.querySelector('.remove-button').onclick = () => removeLiquidity(lpTokenName, positionId, initialAmount1, initialAmount2, position.token1, position.token2);
                    positionElement.querySelector('.claim-button').onclick = () => claimReward(lpTokenName, positionId, rewardAmount, position.token1);
                    currentLiquidity.appendChild(positionElement);
                });
            });
        }

        if (currentLiquidity.children.length <= 1) {
            currentLiquidity.innerHTML += '<p>No current liquidity positions found.</p>';
        }
    }

    const handleSignIn = (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showToast('Please enter both email and password.', 'error');
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                showToast('Signed in successfully!', 'success');
            })
            .catch((error) => {
                let message = 'An unknown error occurred.';
                switch (error.code) {
                    case 'auth/user-not-found':
                        message = 'No user found with this email.';
                        break;
                    case 'auth/wrong-password':
                        message = 'Incorrect password. Please try again.';
                        break;
                    case 'auth/invalid-email':
                        message = 'The email address is not valid.';
                        break;
                    default:
                        message = error.message;
                        break;
                }
                showToast(message, 'error');
            });
    };

    if (signInForm) {
        signInForm.addEventListener('submit', handleSignIn);
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            authContainer.style.display = 'none';
            liquidityContainer.style.display = 'block';
            loadAllTokenBalances(user.uid);
            loadCurrentLiquidity(user.uid); 
            updateLpTokenName();
            ensureUniqueTokenSelection(token1Select);
            fetchTokenPricesAndRender(); 
            setInterval(fetchTokenPricesAndRender, 30000);
        } else {
            currentUserId = null;
            authContainer.style.display = 'flex';
            liquidityContainer.style.display = 'none';
        }
    });

    token1Select.addEventListener('change', () => {
        ensureUniqueTokenSelection(token1Select);
        updateBalanceDisplay();
        updateLpTokenName();
        token1AmountInput.value = '';
        token2AmountInput.value = '';
    });

    token2Select.addEventListener('change', () => {
        ensureUniqueTokenSelection(token2Select);
        updateBalanceDisplay();
        updateLpTokenName();
        token1AmountInput.value = '';
        token2AmountInput.value = '';
    });

    addLiquidityButton.addEventListener('click', addLiquidity);
    token1AmountInput.addEventListener('input', updateToken2AmountBasedOnToken1);
    token2AmountInput.addEventListener('input', updateToken1AmountBasedOnToken2);

    function ensureUniqueTokenSelection(changedSelectElement) {
        const token1 = token1Select.value;
        const token2 = token2Select.value;

        if (token1 === token2) {
            let otherSelectElement = (changedSelectElement === token1Select) ? token2Select : token1Select;
            for (let i = 0; i < otherSelectElement.options.length; i++) {
                if (otherSelectElement.options[i].value !== token1) {
                    otherSelectElement.value = otherSelectElement.options[i].value;
                    const key = (otherSelectElement === token1Select) ? 'token1' : 'token2';
                    const option = otherSelectElement.options[i];
                    document.getElementById(`${key}SelectedImage`).src = option.dataset.image;
                    document.getElementById(`${key}SelectedText`).textContent = option.text.split(' ')[0];
                    break;
                }
            }
        }
        updateBalanceDisplay();
        updateLpTokenName();
    }

    function loadAllTokenBalances(userId) {
        const walletRef = database.ref(`wallets/${userId}`);
        walletRef.on('value', snapshot => {
            const walletData = snapshot.val() || {};
            tokenBalances = {};
            for (const token in walletData) {
                if (walletData[token] && typeof walletData[token].balance === 'number') {
                    tokenBalances[token] = walletData[token].balance;
                }
            }
            updateBalanceDisplay();
        });
    }

    function updateBalanceDisplay() {
        const selectedToken1 = token1Select.value;
        const selectedToken2 = token2Select.value;
        token1BalanceDisplay.textContent = (tokenBalances[selectedToken1] || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        token2BalanceDisplay.textContent = (tokenBalances[selectedToken2] || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }

    function updateLpTokenName() {
        const token1 = token1Select.options[token1Select.selectedIndex].text.split(' ')[0];
        const token2 = token2Select.options[token2Select.selectedIndex].text.split(' ')[0];
        lpTokenNameDisplay.textContent = `${token1}_${token2}_LP`;
    }

    async function fetchTokenPricesAndRender() {
        await fetchTokenPrices();
        renderLiquidityPositions();
    }

    async function fetchTokenPrices() {
        const coinGeckoIds = {
            'usdt_sui': 'tether',
            'usdc_sui': 'usd-coin',
            'sui': 'sui',
            'walrus': 'walrus-2',
            'sol': 'solana',
            'pengu': 'pudgy-penguins',
            'jup': 'jupiter-exchange-solana',
            'cosmos': 'cosmos',
            'haedal': 'haedal',
            'ethereum': 'ethereum',
        };
        const idsToFetch = Object.values(coinGeckoIds).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch}&vs_currencies=usd`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            for (const uiId in coinGeckoIds) {
                const cgId = coinGeckoIds[uiId];
                tokenPrices[uiId] = data[cgId]?.usd || 0;
            }
        } catch (error) {
            console.error('Failed to fetch token prices:', error);
        }
    }

    function updateToken2AmountBasedOnToken1() {
        const amount1 = parseFloat(token1AmountInput.value);
        const token1 = token1Select.value;
        const token2 = token2Select.value;

        if (isNaN(amount1) || !tokenPrices[token1] || !tokenPrices[token2] || tokenPrices[token2] === 0) {
            token2AmountInput.value = '';
            return;
        }
        const requiredAmount2 = (amount1 * tokenPrices[token1]) / tokenPrices[token2];
        token2AmountInput.value = requiredAmount2.toFixed(4);
    }

    function updateToken1AmountBasedOnToken2() {
        const amount2 = parseFloat(token2AmountInput.value);
        const token1 = token1Select.value;
        const token2 = token2Select.value;

        if (isNaN(amount2) || !tokenPrices[token1] || !tokenPrices[token2] || tokenPrices[token1] === 0) {
            token1AmountInput.value = '';
            return;
        }
        const requiredAmount1 = (amount2 * tokenPrices[token2]) / tokenPrices[token1];
        token1AmountInput.value = requiredAmount1.toFixed(4);
    }

    async function getTransactionDetails(fromNetwork) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let hash = '';
        for (let i = 0; i < 64; i++) hash += chars.charAt(Math.floor(Math.random() * chars.length));
        
        let gasFee = 0.02;
        const networkForGas = fromNetwork || 'sui';

        try {
            const gasFeeRef = database.ref(`gasprice/${networkForGas}/gasFee`);
            const snapshot = await gasFeeRef.once('value');
            if (snapshot.exists()) {
                const fetchedFee = parseFloat(snapshot.val());
                if (!isNaN(fetchedFee) && fetchedFee > 0) {
                    gasFee = fetchedFee;
                }
            } else {
                if(networkForGas) await gasFeeRef.set(gasFee);
            }
        } catch (error) {
            console.error(`Could not fetch gas fee for ${networkForGas}, using default.`, error);
        }
        return { hash, gasFee };
    }

    async function addLiquidity() {
        const amount1 = parseFloat(token1AmountInput.value);
        const amount2 = parseFloat(token2AmountInput.value);
        const token1 = token1Select.value;
        const token2 = token2Select.value;

        if (isNaN(amount1) || amount1 <= 0 || isNaN(amount2) || amount2 <= 0) {
            showToast('Please enter valid amounts for both tokens.', 'error');
            return;
        }
        if (!tokenPrices[token1] || !tokenPrices[token2]) {
            showToast('Token prices not available. Please try again.', 'error');
            return;
        }
        if (amount1 > (tokenBalances[token1] || 0) || amount2 > (tokenBalances[token2] || 0)) {
            showToast('Insufficient balance for one or both tokens.', 'error');
            return;
        }

        const { hash, gasFee } = await getTransactionDetails(token1);
        let totalSuiNeeded = gasFee;
        if (token1 === 'sui') totalSuiNeeded += amount1;
        if (token2 === 'sui') totalSuiNeeded += amount2;

        if ((tokenBalances['sui'] || 0) < totalSuiNeeded) {
            showToast(`Insufficient SUI for transaction and gas. Required: ~${totalSuiNeeded.toFixed(6)} SUI.`, 'error');
            return;
        }

        const value1 = amount1 * tokenPrices[token1];
        const value2 = amount2 * tokenPrices[token2];
        const tolerance = 0.01;
        if (Math.abs(value1 - value2) / Math.min(value1, value2) > tolerance) {
            showToast('Token amounts do not match the current price ratio.', 'error');
            return;
        }

        const lpTokenName = `${token1Select.options[token1Select.selectedIndex].text.split(' ')[0]}_${token2Select.options[token2Select.selectedIndex].text.split(' ')[0]}_LP`;
        const confirmationMessage = `Add ${amount1.toFixed(4)} ${token1.toUpperCase()} & ${amount2.toFixed(4)} ${token2.toUpperCase()}?<br>Gas Fee: ${gasFee.toFixed(6)} SUI`;
        
        showConfirmation(confirmationMessage, () => {
            const userId = auth.currentUser.uid;
            const newPositionRef = database.ref(`wallets/${userId}/lp_tokens/${lpTokenName}`).push();

            const updates = {};
            updates[`wallets/${userId}/${token1}/balance`] = firebase.database.ServerValue.increment(-amount1);
            updates[`wallets/${userId}/${token2}/balance`] = firebase.database.ServerValue.increment(-amount2);
            
            let suiAdjustment = -gasFee;
            if (token1 === 'sui') suiAdjustment -= amount1;
            if (token2 === 'sui') suiAdjustment -= amount2;
            if (suiAdjustment !== 0) {
                updates[`wallets/${userId}/sui/balance`] = firebase.database.ServerValue.increment(suiAdjustment);
            }

            updates[`wallets/${userId}/lp_tokens/${lpTokenName}/${newPositionRef.key}`] = {
                token1, token2, amount1, amount2,
                createdAt: new Date().toISOString(),
                lastClaimed: new Date().toISOString()
            };
            updates[`transactions/allnetwork/${hash}`] = {
                sender: userId, 
                recipient: '0000000000000000000000000002', type: 'add_liquidity',
                amount: (amount1 + amount2).toString(),
                amountReceived: (amount1 + amount2).toString(),
                network: `${token1} & ${token2}`, lpTokenName, amount1, amount2,
                memo: `Add Liquidity: ${amount1.toFixed(4)} ${token1.toUpperCase()} & ${amount2.toFixed(4)} ${token2.toUpperCase()}`,
                gasFee, timestamp: new Date().toISOString(), status: 'completed'
            };

            database.ref().update(updates).then(() => {
                showToast(`Successfully added liquidity!`, 'success');
                token1AmountInput.value = '';
                token2AmountInput.value = '';
            }).catch(error => showToast(`Error: ${error.message}`, 'error'));
        });
    }

    async function removeLiquidity(lpTokenName, positionId, initialAmount1, initialAmount2, token1, token2) {
        const { hash, gasFee } = await getTransactionDetails(token1);
        if ((tokenBalances['sui'] || 0) < gasFee) {
            showToast(`Insufficient SUI for gas fee. Required: ${gasFee.toFixed(6)} SUI`, 'error');
            return;
        }

        const confirmationMessage = `Remove your liquidity of ${initialAmount1} ${token1.toUpperCase()} and ${initialAmount2} ${token2.toUpperCase()}?<br>Gas Fee: ${gasFee.toFixed(6)} SUI`;
        showConfirmation(confirmationMessage, () => {
            const userId = auth.currentUser.uid;
            const updates = {};

            let suiAdjustment = -gasFee;

            if (token1 === 'sui') {
                suiAdjustment += initialAmount1;
            } else {
                updates[`wallets/${userId}/${token1}/balance`] = firebase.database.ServerValue.increment(initialAmount1);
            }
            
            if (token2 === 'sui') {
                suiAdjustment += initialAmount2;
            } else {
                updates[`wallets/${userId}/${token2}/balance`] = firebase.database.ServerValue.increment(initialAmount2);
            }
            
            updates[`wallets/${userId}/sui/balance`] = firebase.database.ServerValue.increment(suiAdjustment);

            updates[`wallets/${userId}/lp_tokens/${lpTokenName}/${positionId}`] = null;
            updates[`transactions/allnetwork/${hash}`] = {
                sender: '0000000000000000000000000002', recipient: userId, type: 'remove_liquidity',
                network: `${token1} & ${token2}`,
                amount: (initialAmount1 + initialAmount2).toString(),
                amountReceived: (initialAmount1 + initialAmount2).toString(), lpTokenName, amount1: initialAmount1, amount2: initialAmount2,
                memo: `Remove Liquidity: ${initialAmount1.toFixed(4)} ${token1.toUpperCase()} & ${initialAmount2.toFixed(4)} ${token2.toUpperCase()}`,
                gasFee, timestamp: new Date().toISOString(), status: 'completed'
            };

            database.ref().update(updates)
                .then(() => showToast('Liquidity removed successfully!', 'success'))
                .catch(error => showToast(`Error removing liquidity: ${error.message}`, 'error'));
        });
    }

    async function claimReward(lpTokenName, positionId, rewardAmount, rewardToken) {
        if (rewardAmount <= 0.00000001) {
            showToast("No rewards to claim yet.", 'info');
            return;
        }
        const { hash, gasFee } = await getTransactionDetails(rewardToken);
        if ((tokenBalances['sui'] || 0) < gasFee) {
            showToast(`Insufficient SUI for gas fee. Required: ${gasFee.toFixed(6)} SUI`, 'error');
            return;
        }

        const confirmationMessage = `Claim ${rewardAmount.toFixed(8)} ${rewardToken.toUpperCase()}?<br>Gas Fee: ${gasFee.toFixed(6)} SUI`;
        showConfirmation(confirmationMessage, () => {
            const userId = auth.currentUser.uid;
            
            const updates = {};
            updates[`wallets/${userId}/${rewardToken}/balance`] = firebase.database.ServerValue.increment(rewardAmount);
            
            let suiAdjustment = -gasFee;
            if(rewardToken === 'sui') suiAdjustment += rewardAmount;
            updates[`wallets/${userId}/sui/balance`] = firebase.database.ServerValue.increment(suiAdjustment);

            updates[`wallets/${userId}/lp_tokens/${lpTokenName}/${positionId}/lastClaimed`] = new Date().toISOString();
            updates[`transactions/allnetwork/${hash}`] = {
                sender: '0000000000000000000000000002', recipient: userId, type: 'claim_reward',
                network: rewardToken, rewardToken, amount: rewardAmount, amountReceived: rewardAmount, rewardAmount, lpTokenName,
                memo: `Claim Reward: ${rewardAmount.toFixed(8)} ${rewardToken.toUpperCase()}`,
                gasFee, timestamp: new Date().toISOString(), status: 'completed'
            };

            database.ref().update(updates)
                .then(() => showToast('Reward claimed successfully!', 'success'))
                .catch(error => showToast(`Error claiming reward: ${error.message}`, 'error'));
        });
    }

    function calculateReward(position, price1) {
        const LP_APY_BASE = 200;
        const now = new Date();
        const lastClaimed = new Date(position.lastClaimed);
        const daysDiff = (now - lastClaimed) / (1000 * 60 * 60 * 24);

        const valueToken1 = position.amount1 * (price1 || 0);
        const totalValue = valueToken1 * 2;
        const rewardInUSD = totalValue * (LP_APY_BASE / 100) * (daysDiff / 365);
        
        const rewardAmount = (price1 > 0) ? rewardInUSD / price1 : 0;
        return { rewardAmount, rewardValueUSD: rewardInUSD };
    }

    function loadCurrentLiquidity(userId) {
        const lpTokensRef = database.ref(`wallets/${userId}/lp_tokens`);
        lpTokensRef.on('value', async snapshot => {
            userLpPositions = snapshot.val() || {};
            renderLiquidityPositions();
        });
    }

    document.getElementById('themeToggle').addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        document.getElementById('themeIcon').className = document.body.classList.contains('dark-theme') ? 'fas fa-moon' : 'fas fa-sun';
    });

    function setupCustomSelects() {
        const originalSelects = { token1: document.getElementById('token1Select'), token2: document.getElementById('token2Select') };
        const triggers = { token1: document.getElementById('token1SelectTrigger'), token2: document.getElementById('token2SelectTrigger') };
        const optionsContainers = { token1: document.getElementById('token1Options'), token2: document.getElementById('token2Options') };

        function populateOptions(selectKey) {
            const container = optionsContainers[selectKey];
            const originalSelect = originalSelects[selectKey];
            container.innerHTML = '';
            
            const otherSelectKey = selectKey === 'token1' ? 'token2' : 'token1';
            const disabledValue = originalSelects[otherSelectKey].value;

            Array.from(originalSelect.options).forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'custom-select-option';
                optionElement.dataset.value = option.value;
                if (option.value === disabledValue) optionElement.classList.add('disabled');

                optionElement.innerHTML = `<img src="${option.dataset.image}" alt="${option.text}"><span>${option.text}</span>`;
                optionElement.addEventListener('click', () => {
                    if (optionElement.classList.contains('disabled')) return;
                    originalSelect.value = option.value;
                    document.getElementById(`${selectKey}SelectedImage`).src = option.dataset.image;
                    document.getElementById(`${selectKey}SelectedText`).textContent = option.text.split(' ')[0];
                    container.style.display = 'none';
                    originalSelect.dispatchEvent(new Event('change'));
                });
                container.appendChild(optionElement);
            });
        }

        Object.keys(triggers).forEach(selectKey => {
            triggers[selectKey].addEventListener('click', (event) => {
                event.stopPropagation();
                const isVisible = optionsContainers[selectKey].style.display === 'block';
                Object.values(optionsContainers).forEach(c => c.style.display = 'none');
                if (!isVisible) {
                    populateOptions(selectKey);
                    optionsContainers[selectKey].style.display = 'block';
                }
            });
        });
        
        function initializeDisplay() {
            ['token1', 'token2'].forEach(key => {
                const sel = originalSelects[key];
                const opt = sel.options[sel.selectedIndex];
                document.getElementById(`${key}SelectedImage`).src = opt.dataset.image;
                document.getElementById(`${key}SelectedText`).textContent = opt.text.split(' ')[0];
            });
        }
        initializeDisplay();
    }

    window.addEventListener('click', () => Object.values(document.querySelectorAll('.custom-select-options')).forEach(c => c.style.display = 'none'));
    setupCustomSelects();
}