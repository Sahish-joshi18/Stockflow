/* StockFlow Inventory Management System - Multi Store Edition */
const LS_KEY = 'stockflow_data_v2';
const OLD_KEY = 'stockflow_data_v1';
let salesChart, categoryChart;
let state = loadData();

const DEMO_USERS = {
  admin: { id: 'admin', password: '1234', role: 'admin', name: 'Admin User' },
  manager: { id: 'manager', password: '1234', role: 'manager', name: 'Store Manager' },
  staff: { id: 'staff', password: '1234', role: 'staff', name: 'Staff Member' }
};
const SESSION_KEY = 'stockflow_session';
let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');

function sampleData(){
  const s1={id:uid(),name:'Mumbai Main Store',code:'MUM-01',manager:'Rahul Sharma',phone:'+91 98765 43210',address:'Andheri, Mumbai'};
  const s2={id:uid(),name:'Pune Branch',code:'PUN-02',manager:'Priya Patil',phone:'+91 91234 56780',address:'Baner, Pune'};
  const s3={id:uid(),name:'Delhi Warehouse',code:'DEL-03',manager:'Aman Verma',phone:'+91 90000 11111',address:'Rohini, Delhi'};
  return {
    theme:'light',
    activeStore:'all',
    role:'admin',
    stores:[s1,s2,s3],
    categories:['Electronics','Stationery','Clothing','Grocery'],
    suppliers:[
      {id:uid(),name:'Tech Bharat Suppliers',phone:'+91 98765 43210',email:'tech@supplier.com',address:'Mumbai'},
      {id:uid(),name:'Office Mart',phone:'+91 91234 56780',email:'office@mart.com',address:'Pune'},
      {id:uid(),name:'Daily Essentials',phone:'+91 90000 11111',email:'daily@essentials.com',address:'Delhi'}
    ],
    products:[
      {id:uid(),storeId:s1.id,name:'Wireless Mouse',sku:'EL-MOU-101',category:'Electronics',supplier:'Tech Bharat Suppliers',purchase:350,selling:599,qty:28,low:8,barcode:'890101',desc:'Ergonomic wireless mouse',image:'',created:today()},
      {id:uid(),storeId:s1.id,name:'A4 Notebook',sku:'ST-NOT-202',category:'Stationery',supplier:'Office Mart',purchase:35,selling:65,qty:75,low:20,barcode:'890202',desc:'Ruled notebook',image:'',created:today()},
      {id:uid(),storeId:s2.id,name:'Cotton T-Shirt',sku:'CL-TSH-303',category:'Clothing',supplier:'Daily Essentials',purchase:180,selling:399,qty:12,low:10,barcode:'890303',desc:'Plain cotton t-shirt',image:'',created:today()},
      {id:uid(),storeId:s3.id,name:'USB Keyboard',sku:'EL-KEY-404',category:'Electronics',supplier:'Tech Bharat Suppliers',purchase:520,selling:899,qty:0,low:6,barcode:'890404',desc:'Full-size USB keyboard',image:'',created:today()}
    ],
    sales:[],
    stockHistory:[],
    activity:[{date:new Date().toLocaleString(),text:'Multi-store sample inventory loaded successfully.'}]
  }
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function today(){return new Date().toISOString().slice(0,10)}
function currency(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
function loadData(){
  const saved=localStorage.getItem(LS_KEY) || localStorage.getItem(OLD_KEY);
  const data=saved?JSON.parse(saved):sampleData();
  return migrateData(data);
}
function migrateData(data){
  if(!data.stores || !data.stores.length){
    const main={id:uid(),name:'Main Store',code:'MAIN-01',manager:'Owner',phone:'',address:'Default branch'};
    data.stores=[main];
    data.activeStore='all';
    data.products=(data.products||[]).map(p=>({...p,storeId:p.storeId||main.id}));
  }
  data.activeStore=data.activeStore||'all';
  data.role=data.role||'admin';
  data.sales=(data.sales||[]).map(s=>({...s,customer:s.customer||'Walk-in Customer',customerPhone:s.customerPhone||'',invoiceNo:s.invoiceNo||('INV-'+String(Date.now()).slice(-6)),storeId:s.storeId||(data.products||[]).find(p=>p.name===s.product)?.storeId||data.stores[0].id}));
  data.stockHistory=(data.stockHistory||[]).map(h=>({...h,storeId:h.storeId||data.stores[0].id}));
  return data;
}
function saveData(){localStorage.setItem(LS_KEY,JSON.stringify(state))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function currentRole(){return state.role||'admin'}
function canManage(){return currentRole()==='admin'}
function canManageStock(){return currentRole()==='admin'||currentRole()==='manager'}
function addActivity(text,type='info'){state.activity.unshift({date:new Date().toLocaleString(),text,type,role:currentRole()});state.activity=state.activity.slice(0,50)}
function productStatus(p){if(p.qty<=0)return 'out'; if(p.qty<=p.low)return 'low'; return 'in'}
function statusLabel(s){return s==='out'?'Out of Stock':s==='low'?'Low Stock':'In Stock'}
function getStore(id){return state.stores.find(s=>s.id===id) || {name:'Unknown Store',code:'N/A'}}
function activeProducts(){return state.activeStore==='all'?state.products:state.products.filter(p=>p.storeId===state.activeStore)}
function activeSales(){return state.activeStore==='all'?state.sales:state.sales.filter(s=>s.storeId===state.activeStore)}
function activeHistory(){return state.activeStore==='all'?state.stockHistory:state.stockHistory.filter(h=>h.storeId===state.activeStore)}
function findProduct(name){return (state.products||[]).find(p=>p.name===name)}

document.addEventListener('DOMContentLoaded',()=>{applyTheme();bindLoginEvents();bindEvents();initAuthView();});

function bindLoginEvents(){
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.onsubmit = e => {
      e.preventDefault();
      const staffId = document.getElementById('loginStaffId').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value.trim();
      const user = DEMO_USERS[staffId];
      if(!user || user.password !== password){
        toast('Invalid demo Staff ID or password');
        return;
      }
      session = { id: user.id, name: user.name, role: user.role, loginAt: new Date().toISOString() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      state.role = user.role;
      addActivity(`${user.name} logged in as ${user.role}`, 'login');
      saveData();
      initAuthView();
      toast(`Welcome, ${user.name}`);
    };
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.onclick = () => {
      const oldName = session?.name || 'User';
      addActivity(`${oldName} logged out`, 'logout');
      saveData();
      session = null;
      localStorage.removeItem(SESSION_KEY);
      initAuthView();
      toast('Logged out successfully');
    };
  }
}
function initAuthView(){
  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');
  if(session){
    state.role = session.role;
    loginScreen?.classList.add('hidden');
    appShell?.classList.remove('locked');
    renderAll();
  }else{
    loginScreen?.classList.remove('hidden');
    appShell?.classList.add('locked');
  }
}
function bindEvents(){
  document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn=>btn.addEventListener('click',()=>showSection(btn.dataset.section)));
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  document.getElementById('menuBtn').onclick=()=>{sidebar.classList.toggle('open'); overlay.classList.toggle('show', sidebar.classList.contains('open'));};
  overlay.onclick=()=>{sidebar.classList.remove('open'); overlay.classList.remove('show');};
  const mobileFab = document.getElementById('mobileFab');
  if(mobileFab) mobileFab.onclick=()=>{if(!canManage())return toast('Staff/Manager demo role cannot add products');openProductModal();};
  document.getElementById('toggleTheme').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';saveData();applyTheme();};
  document.getElementById('activeStoreSelect').onchange=e=>{state.activeStore=e.target.value;addActivity(state.activeStore==='all'?'Viewing all stores':`Viewing ${getStore(state.activeStore).name}`,'store');saveData();renderAll();toast(state.activeStore==='all'?'Showing all stores':`Showing ${getStore(state.activeStore).name}`)};
  document.getElementById('openProductModal').onclick=()=>{if(!canManage())return toast('Staff/Manager demo role cannot add products');openProductModal();};
  document.getElementById('closeProductModal').onclick=closeProductModal;
  document.getElementById('productForm').onsubmit=saveProduct;
  document.getElementById('stockForm').onsubmit=adjustStock;
  document.getElementById('saleForm').onsubmit=createSale;
  document.getElementById('categoryForm').onsubmit=addCategory;
  document.getElementById('supplierForm').onsubmit=addSupplier;
  document.getElementById('openStoreModal').onclick=()=>{if(!canManage())return toast('Only Admin can add stores');openStoreModal();};
  document.getElementById('closeStoreModal').onclick=closeStoreModal;
  document.getElementById('storeForm').onsubmit=saveStore;
  ['productSearch','storeFilter','categoryFilter','statusFilter','sortProducts'].forEach(id=>document.getElementById(id).addEventListener('input',renderProducts));
  document.getElementById('downloadPdf').onclick=downloadPdfReport;
  document.getElementById('exportCsv').onclick=exportCsv;
  document.getElementById('backupJson').onclick=backupJson;
  document.getElementById('importJson').onchange=importJson;
  document.getElementById('clearActivity').onclick=()=>{if(!canManage())return toast('Only Admin can clear activity log');state.activity=[];saveData();renderAll();toast('Activity log cleared')};
  document.getElementById('resetData').onclick=()=>{if(!canManage())return toast('Only Admin can reset data');if(confirm('Reset all data?')){state=sampleData();saveData();renderAll();toast('Data reset complete')}};
}
function showSection(id){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===id));document.getElementById('pageTitle').textContent=id[0].toUpperCase()+id.slice(1);document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay')?.classList.remove('show');renderAll();}
function applyTheme(){document.body.classList.toggle('dark',state.theme==='dark')}
function applyRoleAccess(){
  document.body.dataset.role=currentRole();
  const pill = document.getElementById('userPill');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  const role = currentRole().toUpperCase();
  const name = session ? session.name : 'Admin User';
  if(pill) pill.textContent = role;
  if(userName) userName.textContent = name;
  if(userAvatar) userAvatar.textContent = name.trim().charAt(0).toUpperCase();
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=canManage()?'':'none');
}
function renderAll(){applyRoleAccess();renderSelects();renderStoreSummary();renderStores();renderDashboard();renderProducts();renderStockHistory();renderSales();renderCategories();renderSuppliers();renderReport();renderFullActivity();}
function renderSelects(){
  const storeOpts='<option value="all">All Stores</option>'+state.stores.map(s=>`<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
  activeStoreSelect.innerHTML=storeOpts; activeStoreSelect.value=state.activeStore;
  storeFilter.innerHTML=storeOpts;
  productStore.innerHTML=state.stores.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  const catOpts='<option value="all">All Categories</option>'+state.categories.map(c=>`<option value="${c}">${c}</option>`).join('');
  categoryFilter.innerHTML=catOpts;
  productCategory.innerHTML=state.categories.map(c=>`<option>${c}</option>`).join('');
  productSupplier.innerHTML=state.suppliers.map(s=>`<option>${s.name}</option>`).join('');
  const products=activeProducts();
  const productOpts=products.length?products.map(p=>`<option value="${p.id}">${p.name} - ${getStore(p.storeId).code} (${p.qty} left)</option>`).join(''):'<option value="">No products in selected store</option>';
  stockProduct.innerHTML=productOpts;
  saleProduct.innerHTML=productOpts;
}
function renderStoreSummary(){
  const store=state.activeStore==='all'?null:getStore(state.activeStore);
  const count=activeProducts().length;
  activeStoreSummary.innerHTML=`<div class="summary-card"><div><span>Current View</span><strong>${store?store.name:'All Stores'}</strong><p>${store?store.address:'Combined dashboard for every branch'} • ${count} products</p></div><button class="small-btn" onclick="showSection('stores')">Manage Stores</button></div>`;
}
function renderDashboard(){
  const products=activeProducts(), sales=activeSales();
  const inv=products.reduce((a,p)=>a+p.purchase*p.qty,0), totalSales=sales.reduce((a,s)=>a+s.total,0), profit=sales.reduce((a,s)=>a+s.profit,0);
  totalProducts.textContent=products.length;
  inventoryValue.textContent=currency(inv);
  document.getElementById('totalSales').textContent=currency(totalSales);
  totalProfit.textContent=currency(profit);
  lowStockCount.textContent=products.filter(p=>productStatus(p)==='low').length;
  outStockCount.textContent=products.filter(p=>productStatus(p)==='out').length;
  activityList.innerHTML=state.activity.length?state.activity.slice(0,8).map(a=>`<div class="activity-item ${a.type||'info'}"><strong>${a.date}</strong> <span>${a.role||'admin'}</span><br>${a.text}</div>`).join(''):'<div class="activity-item">No activity yet.</div>';
  renderFullActivity();
  renderCharts();
}
function renderCharts(){
  const ctx=salesChart?document.getElementById('salesChart'):document.getElementById('salesChart'); const ctx2=document.getElementById('categoryChart');
  const last=activeSales().slice(-7); const labels=last.map(s=>s.date); const data=last.map(s=>s.total);
  if(salesChart)salesChart.destroy(); salesChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Sales',data,tension:.35,fill:true}]},options:{responsive:true,plugins:{legend:{display:false}}}});
  const products=activeProducts(); const cats=state.categories; const catData=cats.map(c=>products.filter(p=>p.category===c).reduce((a,p)=>a+p.qty,0));
  if(categoryChart)categoryChart.destroy(); categoryChart=new Chart(ctx2,{type:'doughnut',data:{labels:cats,datasets:[{data:catData}]},options:{responsive:true}});
}
function renderStores(){
  storeCards.innerHTML=state.stores.map(s=>{
    const products=state.products.filter(p=>p.storeId===s.id); const value=products.reduce((a,p)=>a+p.purchase*p.qty,0); const low=products.filter(p=>productStatus(p)!=='in').length;
    return `<div class="category-card store-card"><div class="store-top"><h4>${s.name}</h4><span>${s.code}</span></div><p>${s.address||'No address added'}</p><div class="store-meta"><b>${products.length}</b> Products <b>${currency(value)}</b> Value <b>${low}</b> Alerts</div><small>Manager: ${s.manager||'Not added'} ${s.phone?`• ${s.phone}`:''}</small><div class="action-row"><button class="small-btn" onclick="setActiveStore('${s.id}')">View Inventory</button><button class="small-btn admin-action" onclick="openStoreModal('${s.id}')">Edit</button><button class="small-btn delete-btn admin-action" onclick="deleteStore('${s.id}')">Delete</button></div></div>`;
  }).join('') || '<div class="empty-state">No stores added.</div>';
}
function setActiveStore(id){state.activeStore=id;saveData();showSection('dashboard');toast(`Switched to ${getStore(id).name}`)}
function openStoreModal(id=''){
  if(!canManage())return toast('Only Admin can manage stores');
  storeModal.classList.add('show'); storeForm.reset(); storeId.value=id; storeModalTitle.textContent=id?'Edit Store':'Add Store';
  if(id){const s=getStore(id); storeName.value=s.name; storeCode.value=s.code; storeManager.value=s.manager||''; storePhone.value=s.phone||''; storeAddress.value=s.address||'';}
}
function closeStoreModal(){storeModal.classList.remove('show')}
function saveStore(e){
  e.preventDefault(); if(!canManage())return toast('Only Admin can save stores'); const id=storeId.value; const data={id:id||uid(),name:storeName.value.trim(),code:storeCode.value.trim(),manager:storeManager.value.trim(),phone:storePhone.value.trim(),address:storeAddress.value.trim()};
  if(id){state.stores=state.stores.map(s=>s.id===id?data:s);addActivity(`Updated store: ${data.name}`)}else{state.stores.push(data);addActivity(`Added store: ${data.name}`)}
  saveData();closeStoreModal();renderAll();toast('Store saved');
}
function deleteStore(id){
  if(!canManage())return toast('Only Admin can delete stores');
  if(state.products.some(p=>p.storeId===id)) return toast('Move or delete products before deleting this store');
  if(!confirm('Delete this store?')) return;
  state.stores=state.stores.filter(s=>s.id!==id); if(state.activeStore===id)state.activeStore='all'; saveData();renderAll();toast('Store deleted');
}
function renderProducts(){
  let rows=[...state.products]; const q=productSearch.value.toLowerCase(); const selectedStore=storeFilter.value||'all'; const cat=categoryFilter.value; const stat=statusFilter.value; const sort=sortProducts.value;
  if(state.activeStore!=='all')rows=rows.filter(p=>p.storeId===state.activeStore);
  if(selectedStore!=='all')rows=rows.filter(p=>p.storeId===selectedStore);
  if(q)rows=rows.filter(p=>p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q)||getStore(p.storeId).name.toLowerCase().includes(q));
  if(cat!=='all')rows=rows.filter(p=>p.category===cat); if(stat!=='all')rows=rows.filter(p=>productStatus(p)===stat);
  if(sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name)); if(sort==='price')rows.sort((a,b)=>b.selling-a.selling); if(sort==='quantity')rows.sort((a,b)=>b.qty-a.qty); if(sort==='newest')rows.sort((a,b)=>b.id.localeCompare(a.id));
  productsTable.innerHTML=rows.length?rows.map(p=>`<tr><td><div class="product-cell"><img class="product-img" src="${p.image||'https://via.placeholder.com/80?text=SF'}" alt=""><div><strong>${p.name}</strong><br><small>${p.desc||''}</small></div></div></td><td><span class="store-pill">${getStore(p.storeId).name}</span></td><td>${p.sku}</td><td>${p.category}</td><td>${p.supplier}</td><td>${currency(p.selling)}</td><td>${p.qty}</td><td><span class="badge ${productStatus(p)}">${statusLabel(productStatus(p))}</span></td><td><div class="action-row"><button class="small-btn admin-action" onclick="openProductModal('${p.id}')">Edit</button><button class="small-btn delete-btn admin-action" onclick="deleteProduct('${p.id}')">Delete</button></div></td></tr>`).join(''):`<tr><td colspan="9">No products found.</td></tr>`;
}
function openProductModal(id=''){
  if(!canManage())return toast('Only Admin can manage products');
  productModal.classList.add('show'); productForm.reset(); productId.value=id;
  productModalTitle.textContent=id?'Edit Product':'Add Product'; renderSelects(); productStore.value=state.activeStore==='all'?state.stores[0].id:state.activeStore;
  if(id){const p=state.products.find(x=>x.id===id); productName.value=p.name; productSku.value=p.sku; productStore.value=p.storeId; productCategory.value=p.category; productSupplier.value=p.supplier; purchasePrice.value=p.purchase; sellingPrice.value=p.selling; productQty.value=p.qty; lowLimit.value=p.low; barcode.value=p.barcode; productDesc.value=p.desc;}
}
function closeProductModal(){productModal.classList.remove('show')}
function fileToBase64(file){return new Promise(res=>{if(!file)return res(''); const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(file);});}
async function saveProduct(e){e.preventDefault(); if(!canManage())return toast('Only Admin can save products'); const id=productId.value; const old=id?state.products.find(p=>p.id===id):null; const img=await fileToBase64(productImage.files[0]); const p={id:id||uid(),storeId:productStore.value,name:productName.value,sku:productSku.value,category:productCategory.value,supplier:productSupplier.value,purchase:+purchasePrice.value,selling:+sellingPrice.value,qty:+productQty.value,low:+lowLimit.value,barcode:barcode.value,desc:productDesc.value,image:img||(old&&old.image)||'',created:old?old.created:today()}; if(id){state.products=state.products.map(x=>x.id===id?p:x);addActivity(`Updated product: ${p.name} in ${getStore(p.storeId).name}`)}else{state.products.unshift(p);addActivity(`Added product: ${p.name} to ${getStore(p.storeId).name}`)} saveData();closeProductModal();renderAll();toast('Product saved');}
function deleteProduct(id){if(!canManage())return toast('Only Admin can delete products'); if(!confirm('Delete this product?'))return; const p=state.products.find(x=>x.id===id); state.products=state.products.filter(x=>x.id!==id); addActivity(`Deleted product: ${p.name}`); saveData();renderAll();toast('Product deleted')}
function adjustStock(e){e.preventDefault(); if(!canManageStock())return toast('Only Admin/Manager can update stock'); const p=state.products.find(x=>x.id===stockProduct.value); if(!p)return toast('No product selected'); const qty=+stockQty.value; if(stockType.value==='reduce'&&qty>p.qty)return toast('Not enough stock'); p.qty+=stockType.value==='add'?qty:-qty; state.stockHistory.unshift({date:new Date().toLocaleString(),storeId:p.storeId,product:p.name,type:stockType.value,qty,reason:stockReason.value}); addActivity(`${stockType.value==='add'?'Added':'Reduced'} ${qty} stock for ${p.name} (${getStore(p.storeId).code})`); saveData(); e.target.reset(); renderAll(); toast('Stock updated');}
function renderStockHistory(){const rows=activeHistory(); stockHistoryTable.innerHTML=rows.length?rows.map(h=>`<tr><td>${h.date}</td><td>${h.product}</td><td>${h.type}</td><td>${h.qty}</td><td>${h.reason} <br><small>${getStore(h.storeId).name}</small></td></tr>`).join(''):'<tr><td colspan="5">No stock history.</td></tr>'}
function createSale(e){e.preventDefault(); const p=state.products.find(x=>x.id===saleProduct.value); if(!p)return toast('No product selected'); const qty=+saleQty.value; if(qty>p.qty)return toast('Sale quantity is greater than available stock'); p.qty-=qty; const total=p.selling*qty, profit=(p.selling-p.purchase)*qty; const sale={id:uid(),invoiceNo:'INV-'+Date.now().toString().slice(-7),date:today(),storeId:p.storeId,product:p.name,sku:p.sku,customer:customerName.value.trim(),customerPhone:customerPhone.value.trim(),qty,rate:p.selling,total,profit}; state.sales.unshift(sale); addActivity(`Created invoice ${sale.invoiceNo} for ${sale.customer} - ${p.name} x ${qty} (${getStore(p.storeId).code})`,'sale'); saveData(); e.target.reset(); renderAll(); toast('Sale and invoice created'); setTimeout(()=>invoice(sale.id),300);}
function renderSales(){const rows=activeSales(); salesTable.innerHTML=rows.length?rows.map(s=>`<tr><td>${s.date}<br><small>${s.invoiceNo||s.id}</small></td><td><strong>${s.customer||'Walk-in Customer'}</strong><br><small>${s.customerPhone||'No phone'}</small></td><td>${s.product}<br><small>${getStore(s.storeId).name}</small></td><td>${s.qty}</td><td>${currency(s.total)}</td><td>${currency(s.profit)}</td><td><button class="small-btn" onclick="invoice('${s.id}')">Download</button></td></tr>`).join(''):'<tr><td colspan="7">No sales yet.</td></tr>'}
function invoice(id){const s=state.sales.find(x=>x.id===id); if(!s)return toast('Invoice not found'); const store=getStore(s.storeId); const html=`<div style="padding:34px;font-family:Inter,Arial;color:#0f172a"><div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4f46e5;padding-bottom:18px"><div><h1 style="margin:0;color:#4f46e5">StockFlow</h1><p style="margin:6px 0 0">${store.name}<br>${store.address||''}<br>${store.phone||''}</p></div><div style="text-align:right"><h2 style="margin:0">INVOICE</h2><p><b>${s.invoiceNo||s.id}</b><br>Date: ${s.date}</p></div></div><div style="margin:22px 0;padding:14px;background:#f8fafc;border-radius:12px"><b>Bill To:</b><br>${s.customer||'Walk-in Customer'}<br>${s.customerPhone||''}</div><table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="background:#eef2ff"><th style="padding:12px;text-align:left">Product</th><th style="padding:12px">SKU</th><th style="padding:12px">Qty</th><th style="padding:12px">Rate</th><th style="padding:12px;text-align:right">Total</th></tr></thead><tbody><tr><td style="padding:12px;border-bottom:1px solid #e2e8f0">${s.product}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center">${s.sku||'-'}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center">${s.qty}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center">${currency(s.rate||s.total/s.qty)}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right">${currency(s.total)}</td></tr></tbody></table><h2 style="text-align:right;margin-top:22px">Grand Total: ${currency(s.total)}</h2><p style="margin-top:36px;color:#64748b;text-align:center">Thank you for your purchase.</p></div>`; addActivity(`Downloaded invoice ${s.invoiceNo||s.id}`,'invoice'); saveData(); renderFullActivity(); html2pdf().from(html).set({margin:8,filename:`${s.invoiceNo||s.id}.pdf`,jsPDF:{unit:'mm',format:'a4'}}).save();}
function addCategory(e){e.preventDefault(); if(!canManage())return toast('Only Admin can add categories'); const name=categoryName.value.trim(); if(!name||state.categories.includes(name))return toast('Category already exists'); state.categories.push(name); addActivity(`Added category: ${name}`); saveData(); e.target.reset();renderAll();}
function renderCategories(){const products=activeProducts(); categoryCards.innerHTML=state.categories.map(c=>`<div class="category-card"><h4>${c}</h4><p>${products.filter(p=>p.category===c).length} products in current view</p><button class="small-btn delete-btn" onclick="deleteCategory('${c}')">Delete</button></div>`).join('')}
function deleteCategory(c){if(!canManage())return toast('Only Admin can delete categories'); if(state.products.some(p=>p.category===c))return toast('Cannot delete category with products'); state.categories=state.categories.filter(x=>x!==c);saveData();renderAll();}
function addSupplier(e){e.preventDefault(); if(!canManage())return toast('Only Admin can add suppliers'); state.suppliers.push({id:uid(),name:supplierName.value,phone:supplierPhone.value,email:supplierEmail.value,address:supplierAddress.value}); addActivity(`Added supplier: ${supplierName.value}`); saveData(); e.target.reset();renderAll();}
function renderSuppliers(){suppliersTable.innerHTML=state.suppliers.map(s=>`<tr><td>${s.name}</td><td>${s.phone}</td><td>${s.email}</td><td>${s.address}</td><td><button class="small-btn delete-btn" onclick="deleteSupplier('${s.id}')">Delete</button></td></tr>`).join('')}
function deleteSupplier(id){if(!canManage())return toast('Only Admin can delete suppliers'); const s=state.suppliers.find(x=>x.id===id); if(state.products.some(p=>p.supplier===s.name))return toast('Cannot delete supplier with products'); state.suppliers=state.suppliers.filter(x=>x.id!==id);saveData();renderAll();}
function renderReport(){const products=activeProducts(), sales=activeSales(); const inv=products.reduce((a,p)=>a+p.purchase*p.qty,0); const saleTotal=sales.reduce((a,s)=>a+s.total,0); const profit=sales.reduce((a,s)=>a+s.profit,0); const low=products.filter(p=>productStatus(p)!=='in'); reportContent.innerHTML=`<p><strong>Store View:</strong> ${state.activeStore==='all'?'All Stores':getStore(state.activeStore).name}</p><p><strong>Total Products:</strong> ${products.length}</p><p><strong>Inventory Value:</strong> ${currency(inv)}</p><p><strong>Total Sales:</strong> ${currency(saleTotal)}</p><p><strong>Total Profit:</strong> ${currency(profit)}</p><h4>Low / Out of Stock Products</h4>${low.length?low.map(p=>`<p>${p.name} - ${p.qty} left (${statusLabel(productStatus(p))}) • ${getStore(p.storeId).name}</p>`).join(''):'<p>All products are healthy.</p>'}`;}
function downloadPdfReport(){renderReport(); html2pdf().from(reportArea).set({margin:10,filename:'stockflow-store-report.pdf',jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).save();}
function exportCsv(){const head=['Store','Name','SKU','Category','Supplier','Purchase','Selling','Quantity','Status']; const rows=activeProducts().map(p=>[getStore(p.storeId).name,p.name,p.sku,p.category,p.supplier,p.purchase,p.selling,p.qty,statusLabel(productStatus(p))]); const csv=[head,...rows].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(',')).join('\n'); downloadBlob(csv,'stockflow-store-products.csv','text/csv');}
function renderFullActivity(){const el=document.getElementById('fullActivityList'); if(!el)return; el.innerHTML=state.activity.length?state.activity.map(a=>`<div class="timeline-item ${a.type||'info'}"><div><strong>${a.text}</strong><p>${a.date} • Role: ${(a.role||'admin').toUpperCase()}</p></div><span>${a.type||'log'}</span></div>`).join(''):'<div class="empty-state">No activity recorded yet.</div>'}
function backupJson(){downloadBlob(JSON.stringify(state,null,2),'stockflow-backup.json','application/json')}
function importJson(e){const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=migrateData(JSON.parse(r.result));saveData();renderAll();toast('Backup imported')}catch{toast('Invalid JSON file')}}; r.readAsText(f);}
function downloadBlob(content,name,type){const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href)}
