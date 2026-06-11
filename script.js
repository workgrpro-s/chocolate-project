let cart = [];

function switchTab(role, tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    const targetTab = document.getElementById(tabId);
    if(targetTab) targetTab.classList.add('active');
    if(window.event && window.event.currentTarget) window.event.currentTarget.classList.add('active');
}

function getData(key, defaultData) {
    let stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultData;
}
function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// دالة فحص وتنظيف وتأكيد أرقام الجوال المدخلة (9 أو 10 خانات بدون 0)
function validateAndCleanPhone(phoneString) {
    let clean = phoneString.trim().replace(/\s+/g, '');
    if (clean.startsWith('0')) {
        clean = clean.substring(1);
    }
    if (clean.startsWith('966')) {
        clean = clean.substring(3);
    }
    // يجب أن يتبقى 9 أرقام وتبدأ برقم 5 (النظام السعودي المعتمد للجوالات)
    let regex = /^5[0-9]{8}$/;
    if (regex.test(clean)) {
        return clean; 
    }
    return false;
}

function loadSettings() {
    let settings = getData('store_settings', { projectName: "متجر الشوكولاتة الفاخرة", taxRate: 15, deliveryCost: 25, whatsapp: "966500000000" });
    let pMethods = getData('payment_methods', { cod: true, delivery: true, transfer: true, bankName: "مصرف الراجحي", iban: "SA1234567890" });
    
    if(document.getElementById('client-page-title')) document.getElementById('client-page-title').innerText = settings.projectName;
    if(document.getElementById('client-nav-brand')) document.getElementById('client-nav-brand').innerText = settings.projectName;
    if(document.getElementById('admin-nav-brand')) document.getElementById('admin-nav-brand').innerText = settings.projectName;
    
    if(document.getElementById('set-project-name')) {
        document.getElementById('set-project-name').value = settings.projectName;
        document.getElementById('set-tax-rate').value = settings.taxRate;
        document.getElementById('set-delivery-cost').value = settings.deliveryCost;
        document.getElementById('set-whatsapp').value = settings.whatsapp;
        document.getElementById('pay-cod').checked = pMethods.cod;
        document.getElementById('pay-delivery').checked = pMethods.delivery;
        document.getElementById('pay-transfer').checked = pMethods.transfer;
        document.getElementById('pay-bank-name').value = pMethods.bankName || "";
        document.getElementById('pay-iban-num').value = pMethods.iban || "";
        toggleTransferSettings(pMethods.transfer);
    }
}

function toggleTransferSettings(show) {
    const box = document.getElementById('transfer-details-box');
    if(box) box.style.display = show ? 'block' : 'none';
}

function saveSettings(e) {
    e.preventDefault();
    let phoneVal = document.getElementById('set-whatsapp').value;
    let validPhone = validateAndCleanPhone(phoneVal);
    if(!validPhone) { alert("خطأ! رقم واتساب الإدارة لابد أن يتكون من 9 أرقام صحيحة ويبدأ بـ 5 بدون أصفار."); return; }

    let newSettings = {
        projectName: document.getElementById('set-project-name').value,
        taxRate: parseFloat(document.getElementById('set-tax-rate').value),
        deliveryCost: parseFloat(document.getElementById('set-delivery-cost').value),
        whatsapp: validPhone
    };
    let newMethods = {
        cod: document.getElementById('pay-cod').checked,
        delivery: document.getElementById('pay-delivery').checked,
        transfer: document.getElementById('pay-transfer').checked,
        bankName: document.getElementById('pay-bank-name').value,
        iban: document.getElementById('pay-iban-num').value
    };
    setData('store_settings', newSettings);
    setData('payment_methods', newMethods);
    alert("تم حفظ البيانات البنكية والضريبية وتحديث المتجر تلقائياً!");
    loadSettings();
}

function populatePaymentMethods(selectId) {
    const select = document.getElementById(selectId); if(!select) return;
    select.innerHTML = '';
    let pMethods = getData('payment_methods', { cod: true, delivery: true, transfer: true });
    if(pMethods.cod) select.innerHTML += `<option value="الدفع عند الاستلام">الدفع عند الاستلام من الفرع</option>`;
    if(pMethods.delivery) select.innerHTML += `<option value="الدفع عند التوصيل">الدفع عند التوصيل للمنزل</option>`;
    if(pMethods.transfer) select.innerHTML += `<option value="تحويل بنكي">تحويل بنكي إلكتروني</option>`;
}

function handlePaymentMethodChangeClient() {
    const methodSelect = document.getElementById('payment-method');
    const bankBox = document.getElementById('client-bank-info-box');
    const bankText = document.getElementById('client-bank-details-text');
    if(!methodSelect || !bankBox) return;

    if(methodSelect.value === "تحويل بنكي") {
        let pMethods = getData('payment_methods', { bankName: "لم تسجل بيانات", iban: "لم تسجل بيانات" });
        bankText.innerText = `اسم البنك: ${pMethods.bankName}\nرقم الآيبان: ${pMethods.iban}`;
        bankBox.style.display = "block";
    } else {
        bankBox.style.display = "none";
    }
}

function processMultipleImages(fileInputId, callback) {
    let fileInput = document.getElementById(fileInputId);
    if (!fileInput || fileInput.files.length === 0) { callback([]); return; }
    let imagesArray = []; let filesCount = fileInput.files.length; let loadedCount = 0;
    for (let i = 0; i < filesCount; i++) {
        let reader = new FileReader();
        reader.onload = function(e) {
            imagesArray.push(e.target.result); loadedCount++;
            if (loadedCount === filesCount) { callback(imagesArray); }
        };
        reader.readAsDataURL(fileInput.files[i]);
    }
}

function addNewProduct(e) {
    e.preventDefault();
    processMultipleImages('new-images', function(base64Images) {
        let products = getData('store_products', []);
        products.push({ 
            id: Date.now(), 
            name: document.getElementById('new-name').value, 
            price: parseFloat(document.getElementById('new-price').value), 
            stock: parseInt(document.getElementById('new-stock').value), 
            duration: document.getElementById('new-duration').value || 'فوري',
            desc: document.getElementById('new-desc').value,
            images: base64Images
        });
        setData('store_products', products);
        displayAdminProducts(); displayProducts();
        document.getElementById('add-product-form').reset();
        alert("تم حفظ ونشر المنتج الجديد بصوره ومدته!");
    });
}

function addNewSubscription(e) {
    e.preventDefault();
    let fileInput = document.getElementById('sub-image'); if(!fileInput.files[0]) return;
    let r = new FileReader();
    r.onloadend = function() {
        let subs = getData('store_subs', []);
        subs.push({ id: "SUB-" + Date.now(), name: document.getElementById('sub-name').value, price: parseFloat(document.getElementById('sub-price').value), image: r.result });
        setData('store_subs', subs); displayAdminSubs(); displayClientSubs();
        document.getElementById('add-sub-form').reset(); alert("تم نشر باقة الاشتراك بنجاح!");
    };
    r.readAsDataURL(fileInput.files[0]);
}

function addNewGalleryImage(e) {
    e.preventDefault();
    let fileInput = document.getElementById('gal-file'); if(!fileInput.files[0]) return;
    let r = new FileReader();
    r.onloadend = function() {
        let gallery = getData('store_gallery', []);
        gallery.push({ id: Date.now(), title: document.getElementById('gal-title').value, image: r.result });
        setData('store_gallery', gallery); displayAdminGallery(); displayClientGallery();
        document.getElementById('add-gallery-form').reset(); alert("تمت إضافة الصورة بنجاح!");
    };
    r.readAsDataURL(fileInput.files[0]);
}

function displayProducts() {
    const container = document.getElementById('products'); if (!container) return; container.innerHTML = '';
    let products = getData('store_products', []);
    if(products.length === 0) { container.innerHTML = '<p>لا توجد منتجات معروضة حالياً.</p>'; return; }
    products.forEach(p => {
        const hasStock = p.stock > 0;
        let mainImg = (p.images && p.images.length > 0) ? p.images[0] : '';
        container.innerHTML += `
            <div class="product-card">
                <div>
                    <img src="${mainImg}" class="product-img" onclick="openImagePopup('${mainImg}', '${p.name}')">
                    <h4>${p.name}</h4>
                    <p class="p-desc">${p.desc || ''}</p>
                    <p class="p-meta"><i class="fas fa-clock"></i> مدة التجهيز: ${p.duration || 'فوري'}</p>
                </div>
                <div>
                    <p style="color:#d4af37; font-weight:bold; margin-bottom:5px;">${p.price} رس</p>
                    <button class="btn-main" style="width:100%;" ${!hasStock?'disabled':''} onclick="addToCart(${p.id}, 'product')">إضافة للطلب</button>
                </div>
            </div>`;
    });
}

function openImagePopup(src, title) {
    const modal = document.getElementById('image-preview-modal');
    const img = document.getElementById('popup-preview-img');
    const txt = document.getElementById('popup-preview-title');
    if(modal && img) { img.src = src; if(txt) txt.innerText = title; modal.style.display = 'flex'; }
}

function displayClientSubs() {
    const container = document.getElementById('client-subs-list'); if (!container) return; container.innerHTML = '';
    let subs = getData('store_subs', []);
    subs.forEach(s => {
        container.innerHTML += `
            <div class="product-card" style="border: 2px solid #d4af37;">
                <img src="${s.image}" class="product-img" onclick="openImagePopup('${s.image}', '${s.name}')">
                <h4>${s.name}</h4>
                <p style="color:#d4af37; font-weight:bold;">${s.price} رس</p>
                <button class="btn-main" style="width:100%; background:#d4af37; color:#4a2c11;" onclick="addToCart('${s.id}', 'sub')">طلب الاشتراك</button>
            </div>`;
    });
}

function displayClientGallery() {
    const container = document.getElementById('client-gallery-list'); if(!container) return; container.innerHTML = '';
    let gallery = getData('store_gallery', []);
    gallery.forEach(g => {
        container.innerHTML += `<div class="gallery-card"><img src="${g.image}" class="gallery-img" onclick="openImagePopup('${g.image}', '${g.title}')"><p>${g.title}</p></div>`;
    });
}

function submitCustomOrder(e) {
    e.preventDefault();
    let phoneVal = document.getElementById('cust-phone').value;
    let cleanPhone = validateAndCleanPhone(phoneVal);
    if(!cleanPhone) { alert("خطأ! رقم الجوال لابد أن يتكون من 9 أرقام صحيحة ويبدأ برقم 5 (مثال: 501234567)."); return; }

    let customs = getData('store_custom_orders', []);
    customs.push({
        id: "CUST-" + Math.floor(10000 + Math.random() * 90000),
        name: document.getElementById('cust-name').value,
        phone: cleanPhone,
        type: document.getElementById('cust-type').value,
        size: document.getElementById('cust-size').value,
        details: document.getElementById('cust-details').value,
        date: new Date().toLocaleString('ar-SA')
    });
    setData('store_custom_orders', customs);
    alert("تم إرسال طلبك الخاص بنجاح وجاري مراجعته من الإدارة!");
    document.getElementById('custom-order-form').reset();
    if(typeof displayAdminCustomOrders === 'function') displayAdminCustomOrders();
}

function addToCart(id, type) {
    if(type === 'product') {
        let products = getData('store_products', []); const product = products.find(p => p.id === id);
        const cartItem = cart.find(item => item.id === id);
        if (cartItem) {
            if (cartItem.qty < product.stock) cartItem.qty++;
            else { alert("عذراً، تجاوزت الكمية المتاحة بالمخزن!"); return; }
        } else { cart.push({ ...product, qty: 1, isSub: false }); }
    } else {
        let subs = getData('store_subs', []); const sub = subs.find(s => s.id === id);
        const cartItem = cart.find(item => item.id === id);
        if (cartItem) { cartItem.qty++; } 
        else { cart.push({ id: sub.id, name: sub.name, price: sub.price, qty: 1, duration: 'موسمي/باقة', isSub: true }); }
    }
    updateCartCounter(); renderCartItems();
}

function updateCartCounter() {
    const el = document.getElementById('cart-count'); if (el) el.innerText = cart.reduce((sum, i) => sum + i.qty, 0);
}

function changeCartQty(id, change) {
    const item = cart.find(i => i.id === id); if(!item) return;
    if(change === 'delete') { cart = cart.filter(i => i.id !== id); } 
    else {
        let newQty = item.qty + change;
        if(newQty <= 0) { cart = cart.filter(i => i.id !== id); } 
        else {
            if(!item.isSub) {
                let products = getData('store_products', []); let p = products.find(prod => prod.id === id);
                if(p && newQty > p.stock) { alert("المخزون المتبقي لا يسمح بزيادة إضافية!"); return; }
            }
            item.qty = newQty;
        }
    }
    updateCartCounter(); renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list'); if(!list) return; list.innerHTML = '';
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += (item.price * item.qty);
        list.innerHTML += `
            <div class="cart-item-row">
                <span>${item.name}</span>
                <div class="qty-controls">
                    <button type="button" class="btn-qty" onclick="changeCartQty(${typeof item.id === 'string' ? `'${item.id}'` : item.id}, 1)">+</button>
                    <b>${item.qty}</b>
                    <button type="button" class="btn-qty" onclick="changeCartQty(${typeof item.id === 'string' ? `'${item.id}'` : item.id}, -1)">-</button>
                </div>
            </div>`;
    });
    let settings = getData('store_settings', { deliveryCost: 25 });
    let deliveryTypeEl = document.getElementById('delivery-type');
    let deliveryCost = (deliveryTypeEl && deliveryTypeEl.value === 'shipping') ? settings.deliveryCost : 0;
    if(document.getElementById('subtotal-val')) document.getElementById('subtotal-val').innerText = subtotal.toFixed(2);
    if(document.getElementById('delivery-val')) document.getElementById('delivery-val').innerText = deliveryCost.toFixed(2);
    if(document.getElementById('total-price')) document.getElementById('total-price').innerText = (subtotal + deliveryCost).toFixed(2);
}

function toggleModal(show) { 
    const modal = document.getElementById('cart-modal'); if(modal) modal.style.display = show ? 'flex' : 'none'; 
    if(show) { populatePaymentMethods('payment-method'); handlePaymentMethodChangeClient(); }
}

function handleDeliveryChange() { renderCartItems(); }

function submitClientOrder(e) {
    e.preventDefault(); if(cart.length === 0) { alert("سلتك فارغة!"); return; }
    let phoneInput = document.getElementById('client-phone').value;
    let cleanPhone = validateAndCleanPhone(phoneInput);
    if(!cleanPhone) { alert("خطأ في رقم الجوال! يجب أن يتكون من 9 أرقام صحيحة ويبدأ بـ 5 بدون صفر."); return; }

    let pMethod = document.getElementById('payment-method').value;
    let orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    
    let orderObj = {
        id: orderId, name: document.getElementById('client-name').value, phone: cleanPhone,
        deliveryType: document.getElementById('delivery-type').value, googleMapsUrl: document.getElementById('client-address').value || "فرع",
        paymentMethod: pMethod, subtotal: parseFloat(document.getElementById('subtotal-val').innerText),
        deliveryCostEstimated: parseFloat(document.getElementById('delivery-val').innerText), items: [...cart], date: new Date().toLocaleString('ar-SA')
    };

    // ⚠️ الميزة الجديدة للتحويل البنكي: تذهب لقسم مستقل يحتاج تحويل معلق فوراً
    if(pMethod === "تحويل بنكي") {
        let pendingTransfers = getData('store_pending_transfers', []);
        pendingTransfers.push(orderObj);
        setData('store_pending_transfers', pendingTransfers);
        alert("تم تسجيل طلبك بنجاح بنظام التحويل البنكي! الرجاء التوجه لأسفل صفحة (تتبع طلباتي) لإرفاق صورة إيصال التحويل لكي نعتمد طلبك.");
    } else {
        let rawOrders = getData('store_raw_orders', []);
        rawOrders.push(orderObj);
        setData('store_raw_orders', rawOrders);
        alert("تم إرسال طلبك بنجاح وبانتظار مراجعة الإدارة!");
    }

    cart = []; updateCartCounter(); toggleModal(false); document.getElementById('order-form').reset(); displayClientOrders();
}

// ⚠️ تعديل شاشات العميل لعرض الفواتير التي تحتاج إرفاق إيصال وعرض مدة التجهيز المروّسة
function displayClientOrders() {
    // 1. فواتير تحتاج تحويل بانتظار العميل يرفع الإيصال
    const tbodyTransfer = document.getElementById('client-transfer-pending-list');
    if(tbodyTransfer) {
        let transfers = getData('store_pending_transfers', []);
        tbodyTransfer.innerHTML = transfers.length === 0 ? '<tr><td colspan="5">لا توجد فواتير معلقة تحتاج تحويل بنكي حالياً.</td></tr>' : '';
        transfers.forEach((o, index) => {
            tbodyTransfer.innerHTML += `
                <tr>
                    <td>${o.id}</td>
                    <td>${o.date}</td>
                    <td><b>${(o.subtotal+o.deliveryCostEstimated).toFixed(2)} رس</b></td>
                    <td><span class="status-badge" style="background:#e74c3c; color:white;">بانتظار إرفاق الإيصال</span></td>
                    <td>
                        <input type="file" id="receipt-upload-file-${index}" accept="image/*" style="font-size:11px;" onchange="uploadReceiptImage(${index})">
                    </td>
                </tr>`;
        });
    }

    // 2. تتبع الطلبات العادية والمنجزة ومضافاً إليها "مدة تجهيز الطلب" المسجلة بالمنتج
    const tbody = document.getElementById('client-orders-list');
    if(tbody) {
        let raws = getData('store_raw_orders', []); let unissued = getData('store_unissued_orders', []);
        let totalPending = [...raws, ...unissued];
        tbody.innerHTML = totalPending.length === 0 ? '<tr><td colspan="6">لا توجد طلبات جارية حالياً.</td></tr>' : '';
        totalPending.forEach(o => {
            let stateText = unissued.some(u => u.id === o.id) ? '<span class="status-badge" style="background:#ffeaa7; color:#d63031;">قيد التجهيز </span>' : '<span class="status-badge status-unpicked">بانتظار موافقة الإدارة</span>';
            
            // استخراج وتجميع مدد التجهيز من داخل أصناف الطلب لعرضها للعميل
            let durationText = o.items.map(i => i.duration || 'فوري').join(' + ');

            tbody.innerHTML += `<tr><td>${o.id}</td><td>${o.date}</td><td>${(o.subtotal+o.deliveryCostEstimated).toFixed(2)} رس</td><td>${o.paymentMethod}</td><td style="color:brown; font-weight:bold;">${durationText}</td><td>${stateText}</td></tr>`;
        });
    }

    // 3. سجل الفواتير المنجزة التسلسلية المعتمدة
    const tbodyInv = document.getElementById('client-invoices-rendered-list');
    if(tbodyInv) {
        let invs = getData('store_rendered_invoices', []); tbodyInv.innerHTML = invs.length === 0 ? '<tr><td colspan="5">لا فواتير منجزة صادرة بعد.</td></tr>' : '';
        invs.forEach(inv => {
            tbodyInv.innerHTML += `<tr><td><b>${inv.id}</b></td><td>${inv.date}</td><td>${inv.total.toFixed(2)} رس</td><td>${inv.paymentMethod}</td><td><button class="btn-main" style="background:#4a2c11;" onclick="viewInvoiceDetails('${inv.id}')"><i class="fas fa-eye"></i> عرض الفاتورة</button></td></tr>`;
        });
    }
}

// العميل يرفع الإيصال وينتقل فوراً لصفحة المدير
function uploadReceiptImage(index) {
    let transfers = getData('store_pending_transfers', []);
    let fileInput = document.getElementById(`receipt-upload-file-${index}`);
    if(!fileInput.files[0]) return;
    
    let reader = new FileReader();
    reader.onloadend = function() {
        let reviewReceipts = getData('store_review_receipts', []);
        let targetOrder = transfers[index];
        targetOrder.receiptImage = reader.result; // تخزين الصورة بالطلب
        targetOrder.transferUploadedDate = new Date().toLocaleString('ar-SA');
        
        reviewReceipts.push(targetOrder);
        transfers.splice(index, 1);
        
        setData('store_pending_transfers', transfers);
        setData('store_review_receipts', reviewReceipts);
        
        alert("شكراً لك! تم إرفاق صورة إيصال التحويل بنجاح، وتم إرسالها لمدير النظام للمراجعة وتأكيد فاتورتك.");
        displayClientOrders();
    };
    reader.readAsDataURL(fileInput.files[0]);
}

// -------------------------------------------------------------
// لوحة التحكم والعمليات الخلفية للمدير والإدارة
// -------------------------------------------------------------
function checkAdminSession() {
    let session = localStorage.getItem('current_session');
    if(!session) { document.getElementById('admin-login-screen').style.display = 'flex'; } 
    else {
        document.getElementById('admin-login-screen').style.display = 'none';
        let user = JSON.parse(session); document.getElementById('current-user-badge').innerText = `المستخدم: ${user.username}`;
        loadSettings(); displayAdminOrders(); displayAdminCustomOrders(); displayAdminUnissuedOrders(); displayAdminProducts(); displayAdminSubs(); displayAdminGallery(); displayAdminInvoices(); displayAdminStaff(); displayAdminReceiptsToReview();
    }
}

function handleAdminLogin() {
    let u = document.getElementById('login-user').value; let p = document.getElementById('login-pass').value;
    let staff = getData('store_staff', [{ username: "admin", password: "123", role: "admin" }]);
    let match = staff.find(s => s.username === u && s.password === p);
    if(match) { localStorage.setItem('current_session', JSON.stringify(match)); checkAdminSession(); } else { alert("عذراً، خطأ في الحساب!"); }
}

function displayAdminOrders() {
    const tbody = document.getElementById('admin-orders-list'); if(!tbody) return; tbody.innerHTML = '';
    let raws = getData('store_raw_orders', []);
    if(raws.length === 0) tbody.innerHTML = '<tr><td colspan="7">لا توجد طلبات جديدة.</td></tr>';
    raws.forEach((o, index) => {
        tbody.innerHTML += `<tr><td>${o.id}</td><td>${o.name}</td><td>${o.phone}</td><td>${o.deliveryType==='shipping'?'توصيل':'فرع'}</td><td><b>${o.paymentMethod}</b></td><td><button class="btn-main" style="background:#007bff;" onclick="viewRawOrderDetails('${o.id}', 'raw')"> المعاينة</button></td><td><button class="btn-main" style="background:#28a745;" onclick="approveToUnissued(${index})"> موافقة واعتماد</button></td></tr>`;
    });
}

function displayAdminCustomOrders() {
    const tbody = document.getElementById('admin-custom-orders-list'); if(!tbody) return; tbody.innerHTML = '';
    let customs = getData('store_custom_orders', []);
    if(customs.length === 0) tbody.innerHTML = '<tr><td colspan="7">لا توجد طلبات مخصصة.</td></tr>';
    customs.forEach((c, index) => {
        tbody.innerHTML += `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.phone}</td><td><b>${c.type}</b></td><td>${c.size}</td><td><small>${c.details}</small></td><td><button class="btn-main" style="background:#e67e22;" onclick="approveCustomToUnissued(${index})"> موافقة وتجهيز</button></td></tr>`;
    });
}

// صفحة المدير الجديدة: الفواتير التي تم تحويلها وبانتظار تأكيد الإيصال
function displayAdminReceiptsToReview() {
    const tbody = document.getElementById('admin-receipts-list'); if(!tbody) return; tbody.innerHTML = '';
    let reviewList = getData('store_review_receipts', []);
    
    const badge = document.getElementById('badge-receipts-count');
    if(badge) { badge.innerText = reviewList.length; badge.style.display = reviewList.length > 0 ? 'inline-block' : 'none'; }

    if(reviewList.length === 0) tbody.innerHTML = '<tr><td colspan="7">لا توجد طلبات تم تحويلها بانتظار المراجعة حالياً.</td></tr>';
    reviewList.forEach((o, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${o.id}</td>
                <td>${o.name}</td>
                <td>${o.phone}</td>
                <td><b>${(o.subtotal+o.deliveryCostEstimated).toFixed(2)} رس</b></td>
                <td><small>${o.transferUploadedDate}</small></td>
                <td>
                    <button class="btn-main" style="background:purple; padding:4px 8px;" onclick="openImagePopup('${o.receiptImage}', 'إيصال العميل: ${o.name}')">👁 عرض الإيصال المرفوع</button>
                </td>
                <td>
                    <button class="btn-main" style="background:#28a745; font-weight:bold;" onclick="approveReceiptAndMakeCompleted(${index})"><i class="fas fa-check-double"></i> تأكيد واستلام المبلغ ومنجز</button>
                </td>
            </tr>`;
    });
}

// موافقة المدير على الإيصال تحول الطلب فورا لفاتورة منجزة متسلسلة وتظهر عند العميل
function approveReceiptAndMakeCompleted(index) {
    let reviewList = getData('store_review_receipts', []);
    let invs = getData('store_rendered_invoices', []);
    let products = getData('store_products', []);
    let settings = getData('store_settings', { taxRate: 15 });
    
    let o = reviewList[index];

    // خصم المنتجات من المخزن
    o.items.forEach(item => {
        if(!item.isSub) { let p = products.find(prod => prod.id === item.id); if(p) p.stock -= item.qty; }
    });
    setData('store_products', products);

    // إنتاج الرقم التسلسلي الصاعد الموحد للفواتير المنجزة
    let serialCounter = parseInt(localStorage.getItem('serial_counter_v4') || "0") + 1;
    localStorage.setItem('serial_counter_v4', serialCounter.toString());
    let formattedSerial = String(serialCounter).padStart(3, '0');
    const finalInvoiceId = "INV-" + formattedSerial;

    let dCost = o.deliveryCostEstimated || 0;
    let taxAmount = (o.subtotal + dCost) * (settings.taxRate / 100);

    invs.push({
        id: finalInvoiceId, name: o.name, phone: o.phone, deliveryType: o.deliveryType, googleMapsUrl: o.googleMapsUrl,
        paymentMethod: o.paymentMethod, subtotal: o.subtotal, deliveryCost: dCost, tax: taxAmount, total: (o.subtotal + dCost + taxAmount),
        items: o.items, date: new Date().toLocaleString('ar-SA')
    });

    setData('store_rendered_invoices', invs);
    reviewList.splice(index, 1); setData('store_review_receipts', reviewList);

    alert(`تم تأكيد استلام المبلغ البنكي بنجاح وإصدار الفاتورة التسلسلية المنجزة للعميل برقم: ${finalInvoiceId}`);
    displayAdminReceiptsToReview(); displayAdminInvoices(); displayProducts(); displayAdminProducts(); displayClientOrders();
}

function approveToUnissued(index) {
    let raws = getData('store_raw_orders', []); let unissued = getData('store_unissued_orders', []);
    let order = raws[index]; order.approvedDate = new Date().toLocaleString('ar-SA');
    unissued.push(order); raws.splice(index, 1);
    setData('store_raw_orders', raws); setData('store_unissued_orders', unissued);
    alert("تمت الموافقة ونقل الطلب لقسم الفواتير غير المنجزة (قيد التجهيز)!");
    displayAdminOrders(); displayAdminUnissuedOrders(); displayClientOrders();
}

function approveCustomToUnissued(index) {
    let customs = getData('store_custom_orders', []); let unissued = getData('store_unissued_orders', []);
    let c = customs[index];
    let convertedOrder = {
        id: c.id, name: c.name, phone: c.phone, deliveryType: "pickup", googleMapsUrl: "فرع",
        paymentMethod: "تحويل بنكي", subtotal: 0, deliveryCostEstimated: 0,
        items: [{ name: `طلب خاص: ${c.type} (${c.size}) - ${c.details}`, qty: 1, price: 0, duration: 'حسب الطلب الخاص', isSub: true }],
        date: c.date, approvedDate: new Date().toLocaleString('ar-SA')
    };
    unissued.push(convertedOrder); customs.splice(index, 1);
    setData('store_custom_orders', customs); setData('store_unissued_orders', unissued);
    alert("تم اعتماد الطلب الخاص وبانتظار التجهيز وتحديد التكلفة المنجزة!");
    displayAdminCustomOrders(); displayAdminUnissuedOrders(); displayClientOrders();
}

function displayAdminUnissuedOrders() {
    const tbody = document.getElementById('admin-unissued-list'); if(!tbody) return; tbody.innerHTML = '';
    let unissued = getData('store_unissued_orders', []);
    if(unissued.length === 0) tbody.innerHTML = '<tr><td colspan="8">لا توجد طلبات غير منجزة.</td></tr>';
    unissued.forEach((o, index) => {
        tbody.innerHTML += `<tr><td>${o.id}</td><td>${o.name}</td><td>${o.phone}</td><td>${o.deliveryType==='shipping'?'توصيل':'فرع'}</td><td>${o.paymentMethod}</td><td><small>${o.approvedDate || o.date}</small></td><td><button class="btn-main" style="background:#007bff;" onclick="viewRawOrderDetails('${o.id}', 'unissued')">استعراض</button></td><td><button class="btn-main" style="background:#28a745;" onclick="finalizeAndIssueInvoice(${index})">تجهيز ومنجز</button></td></tr>`;
    });
}

function viewRawOrderDetails(id, type) {
    let list = type === 'raw' ? getData('store_raw_orders', []) : getData('store_unissued_orders', []);
    let o = list.find(item => item.id === id); if(!o) return;
    let rows = ""; o.items.forEach(item => { rows += `<tr><td>${item.name}</td><td>${item.qty}</td></tr>`; });
    document.getElementById('invoice-print-area').innerHTML = `<div class="printable-invoice"><h3>مكونات الطلب (${o.id})</h3><p><b>العميل:</b> ${o.name}</p><p><b>الجوال:</b> ${o.phone}</p><table><thead><tr><th>الصنف</th><th>الكمية</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    document.getElementById('admin-invoice-actions').style.display = 'none'; document.getElementById('invoice-view-modal').style.display = 'flex';
}

function finalizeAndIssueInvoice(index) {
    let unissued = getData('store_unissued_orders', []); let invs = getData('store_rendered_invoices', []);
    let products = getData('store_products', []); let settings = getData('store_settings', { taxRate: 15 });
    let o = unissued[index];
    
    if(o.subtotal === 0) {
        let pricePrompt = prompt(`ادخل القيمة المالية المتفق عليها للطلب المخصص للشخص (${o.name}):`, "150");
        if(pricePrompt === null || isNaN(parseFloat(pricePrompt))) return;
        o.subtotal = parseFloat(pricePrompt);
    }

    o.items.forEach(item => {
        if(!item.isSub) { let p = products.find(prod => prod.id === item.id); if(p) p.stock -= item.qty; }
    });
    setData('store_products', products);

    let serialCounter = parseInt(localStorage.getItem('serial_counter_v4') || "0") + 1;
    localStorage.setItem('serial_counter_v4', serialCounter.toString());
    let formattedSerial = String(serialCounter).padStart(3, '0');
    const finalInvoiceId = "INV-" + formattedSerial;

    let dCost = o.deliveryCostEstimated || 0; let taxAmount = (o.subtotal + dCost) * (settings.taxRate / 100);
    
    invs.push({
        id: finalInvoiceId, name: o.name, phone: o.phone, deliveryType: o.deliveryType, googleMapsUrl: o.googleMapsUrl,
        paymentMethod: o.paymentMethod, subtotal: o.subtotal, deliveryCost: dCost, tax: taxAmount, total: (o.subtotal + dCost + taxAmount),
        items: o.items, date: new Date().toLocaleString('ar-SA')
    });
    
    setData('store_rendered_invoices', invs); unissued.splice(index, 1); setData('store_unissued_orders', unissued);
    alert(`تم إنجاز الطلب وإصدار الفاتورة التسلسلية الرقمية الثابتة: ${finalInvoiceId}`);
    displayAdminUnissuedOrders(); displayAdminInvoices(); displayProducts(); displayAdminProducts(); displayClientOrders();
}

function searchInvoices(role) {
    let q = document.getElementById(`${role}-search-invoice`).value.toLowerCase();
    let filtered = getData('store_rendered_invoices', []).filter(i => i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
    renderInvoiceCards(role, filtered);
}

function renderInvoiceCards(role, list) {
    const container = document.getElementById(`${role}-invoices-list`); if(!container) return; container.innerHTML = '';
    list.forEach(inv => {
        container.innerHTML += `
            <div class="invoice-card" style="border-color: #28a745;">
                <h4>رقم الفاتورة: ${inv.id}</h4>
                <p><b>العميل:</b> ${inv.name}</p>
                <p><b>المبلغ:</b> ${inv.total.toFixed(2)} رس</p>
                <p><b>طريقة الدفع:</b> ${inv.paymentMethod}</p>
                <button class="btn-main" style="width:100%; margin-top:10px; background: #28a745;" onclick="viewInvoiceDetails('${inv.id}')">عرض الفاتورة الضريبية</button>
            </div>`;
    });
}

function viewInvoiceDetails(invoiceId) {
    let inv = getData('store_rendered_invoices', []).find(i => i.id === invoiceId);
    let settings = getData('store_settings', { taxRate: 15, projectName: "متجر الشوكولاتة", whatsapp: "966500000000" });
    let rows = ""; inv.items.forEach(item => { rows += `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price || inv.subtotal} رس</td></tr>`; });
    
    document.getElementById('invoice-print-area').innerHTML = `
        <div class="printable-invoice">
            <h2>${settings.projectName}</h2>
            <div class="inv-header-meta">
                <p><b>رقم الفاتورة المنجزة:</b> ${inv.id}</p>
                <p><b>العميل:</b> ${inv.name}</p>
                <p><b>جوال العميل:</b> 0${inv.phone}</p>
                <p><b>طريقة الدفع:</b> <b>${inv.paymentMethod}</b></p>
                <p><b>التاريخ:</b> ${inv.date}</p>
            </div>
            <table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr></thead><tbody>${rows}</tbody></table>
            <div class="inv-total-section">
                <p><span>المجموع:</span> <span>${inv.subtotal.toFixed(2)} رس</span></p>
                <p><span>الضريبة (${settings.taxRate}%):</span> <span>${inv.tax.toFixed(2)} رس</span></p>
                <p style="font-size:14px; color:brown;"><span>الصافي النهائي:</span> <span>${inv.total.toFixed(2)} رس</span></p>
            </div>
            <div style="clear:both;"></div>
        </div>`;
    const actions = document.getElementById('admin-invoice-actions'); if(actions) actions.style.display = 'flex';
    document.getElementById('invoice-view-modal').style.display = 'flex';
}

function closeInvoiceModal() { document.getElementById('invoice-view-modal').style.display = 'none'; }

function displayAdminProducts() {
    const tbody = document.getElementById('admin-products-list'); if(!tbody) return; tbody.innerHTML = '';
    getData('store_products', []).forEach((p, index) => {
        let img = (p.images && p.images.length > 0) ? p.images[0] : '';
        tbody.innerHTML += `
            <tr>
                <td><img src="${img}" width="35" height="35" style="object-fit:cover;"></td>
                <td><b>${p.name}</b></td>
                <td><input type="number" id="inline-price-${index}" value="${p.price}" style="width:65px; text-align:center;"></td>
                <td><input type="number" id="inline-stock-${index}" value="${p.stock}" style="width:65px; text-align:center;"></td>
                <td>${p.duration || 'فوري'}</td>
                <td><button class="btn-main" style="background:#2980b9; padding:4px;" onclick="saveInlineProductChanges(${index})">تحديث</button></td>
                <td><button class="btn-main" style="background:#ff4d4d; padding:4px;" onclick="deleteItem(${index}, 'store_products')">حذف</button></td>
            </tr>`;
    });
}

function saveInlineProductChanges(index) {
    let products = getData('store_products', []);
    products[index].price = parseFloat(document.getElementById(`inline-price-${index}`).value);
    products[index].stock = parseInt(document.getElementById(`inline-stock-${index}`).value);
    setData('store_products', products);
    alert("تم حفظ التعديلات وتحديث المخازن!");
    displayAdminProducts(); displayProducts(); displayClientOrders();
}

function displayAdminSubs() {
    const tbody = document.getElementById('admin-subs-list'); if(!tbody) return; tbody.innerHTML = '';
    getData('store_subs', []).forEach((s, idx) => {
        tbody.innerHTML += `<tr><td><img src="${s.image}" width="35" height="35"></td><td>${s.name}</td><td>${s.price} رس</td><td><button class="btn-main" style="background:red;" onclick="deleteItem(${idx}, 'store_subs')">حذف</button></td></tr>`;
    });
}
function displayAdminGallery() {
    const tbody = document.getElementById('admin-gallery-list'); if(!tbody) return; tbody.innerHTML = '';
    getData('store_gallery', []).forEach((g, idx) => {
        tbody.innerHTML += `<tr><td><img src="${g.image}" width="35" height="35"></td><td>${g.title}</td><td><button class="btn-main" style="background:red;" onclick="deleteItem(${idx}, 'store_gallery')">حذف</button></td></tr>`;
    });
}
function deleteItem(index, key) {
    if(confirm("هل تريد الحذف؟")) {
        let items = getData(key, []); items.splice(index, 1); setData(key, items);
        if(key==='store_products') { displayAdminProducts(); displayProducts(); } 
        else if(key==='store_subs') { displayAdminSubs(); displayClientSubs(); }
        else { displayAdminGallery(); displayClientGallery(); }
    }
}
function displayAdminInvoices() { renderInvoiceCards('admin', getData('store_rendered_invoices', [])); }
function addNewStaff(e) {
    e.preventDefault(); let staff = getData('store_staff', [{ username: "admin", password: "123", role: "admin" }]);
    staff.push({ username: document.getElementById('staff-username').value, password: document.getElementById('staff-password').value, role: document.getElementById('staff-role').value });
    setData('store_staff', staff); document.getElementById('add-staff-form').reset(); displayAdminStaff(); alert("تم حفظ الموظف!");
}
function displayAdminStaff() {
    const tbody = document.getElementById('admin-staff-list'); if(!tbody) return; tbody.innerHTML = '';
    getData('store_staff', [{ username: "admin", password: "123", role: "admin" }]).forEach((s, idx) => {
        tbody.innerHTML += `<tr><td>${s.username}</td><td>${s.role==='admin'?'أدمن':'موظف'}</td><td><button class="btn-main" style="background:red;" ${s.username=='admin'?'disabled':''} onclick="deleteStaff(${idx})">حذف</button></td></tr>`;
    });
}
function deleteStaff(idx) { let staff = getData('store_staff'); staff.splice(idx,1); setData('store_staff', staff); displayAdminStaff(); }
