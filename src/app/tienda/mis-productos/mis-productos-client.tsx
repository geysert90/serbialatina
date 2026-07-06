"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API = "https://admin.segun2idioma.com/wp-json/sl/v1";

type Tab = "productos" | "ordenes" | "cupones" | "tienda" | "reportes";

// ─── Types ─────────────────────────────────────────────────────
type ProductImage = { id: number; url: string; featured: boolean };
type Category = { id: number; name: string; slug: string; parent: number; count: number };
type VendorProduct = { id: number; name: string; status: string; price: number; sale_price: number; sku: string; quantity: number; weight: string; dimensions: {length:string;width:string;height:string}; images: ProductImage[]; categories: Category[]; description: string; short_description: string; manage_stock: boolean };
type VendorOrder = { id: number; status: string; total: number; vendor_total: number; date: string; customer: string; items: { name: string; qty: number; total: number; pid: number }[]; payment: string };
type VendorCoupon = { id: number; code: string; amount: number; discount_type: string; usage: number; usage_limit: number; expires: string|null; min_amount: number };
type StoreData = { store_name:string;store_description:string;store_email:string;store_phone:string;address:Record<string,string>;social:Record<string,string>;logo:string|null;banner:string|null;policies:Record<string,string>;payment:Record<string,string> };
type SalesReport = { total_sales: number; commission_rate: string; commission: number; net: number; items_sold: number; daily: { date: string; amount: number }[] };

// ─── Main Page ─────────────────────────────────────────────────
export function MisProductosClient({ storeStatus, storeName, appPassword, wpUsername }: { storeStatus: "approved"|"pending"; storeName: string; appPassword: string|null; wpUsername: string }) {
  const [tab, setTab] = useState<Tab>("productos");

  if (storeStatus === "pending") {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-16 md:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h1 className="text-3xl font-semibold">Tienda pendiente</h1>
          <p className="text-lg text-black/60"><strong>{storeName}</strong> está pendiente de aprobación.</p>
        </div>
      </section>
    );
  }

  if (!appPassword || !wpUsername) return null;
  const auth = { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${wpUsername}:${appPassword}`)}` };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="eyebrow w-fit">{storeName}</div><h1 className="text-3xl font-semibold tracking-[-0.05em]">Dashboard</h1></div>
      </div>
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-black/8 bg-white p-1 [scrollbar-width:none]">
        {(["productos","ordenes","cupones","tienda","reportes"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?"bg-[var(--color-accent)] text-white":"text-black/45 hover:bg-black/5"}`}>
            {t==="productos"?"Productos":t==="ordenes"?"Órdenes":t==="cupones"?"Cupones":t==="tienda"?"Mi Tienda":"Reportes"}
          </button>
        ))}
      </nav>
      <div className="min-h-[400px]">
        {tab==="productos"&&<ProductsTab auth={auth}/>}
        {tab==="ordenes"&&<OrdersTab auth={auth}/>}
        {tab==="cupones"&&<CouponsTab auth={auth}/>}
        {tab==="tienda"&&<StoreTab auth={auth}/>}
        {tab==="reportes"&&<ReportsTab auth={auth}/>}
      </div>
    </section>
  );
}

// ─── Products Tab ──────────────────────────────────────────────
function ProductsTab({ auth }: { auth: Record<string,string> }) {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VendorProduct|null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    try { const r=await window.fetch(`${API}/vendor/products`,{headers:auth}); const d=await r.json(); setProducts(d.products||[]); } catch { setError("Error"); } finally { setLoading(false); }
  }, [auth]);

  useEffect(() => { fetch(); }, [fetch]);

  return <div className="flex flex-col gap-4">
    <button onClick={()=>setShowCreate(true)} className="self-start rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-black">+ Nuevo producto</button>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-24 animate-pulse rounded-2xl bg-black/5"/>)}</div>
    : products.length===0 ? <div className="reserved-slot min-h-[200px]"><div className="eyebrow w-fit">Sin productos</div><p className="text-sm text-black/55">Creá tu primer producto.</p></div>
    : <div className="flex flex-col gap-3">{products.map(p=>(
      <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-black/8 bg-white p-4 hover:border-black/12 transition">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/[0.03]">
          {p.images[0] ? <img src={p.images[0].url} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-black/15 text-2xl">📦</div>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{p.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-black/40 mt-1">
            <span className="font-semibold text-black/70">{p.price.toFixed(2)} RSD</span>
            {p.sale_price>0 && <span className="text-red-500 line-through">{p.sale_price.toFixed(2)}</span>}
            {p.sku && <span>SKU: {p.sku}</span>}
            <span>Stock: {p.quantity}</span>
            <span className={p.status==="publish"?"text-emerald-600":"text-amber-600"}>{p.status==="publish"?"Publicado":p.status}</span>
            {p.categories.length>0 && <span className="hidden sm:inline">{p.categories.map(c=>c.name).join(", ")}</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={()=>setEditing(p)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black/50 hover:bg-black/5">Editar</button>
          <button onClick={async()=>{if(!confirm("¿Eliminar?"))return; await window.fetch(`${API}/vendor/products/${p.id}`,{method:"DELETE",headers:auth});fetch();}} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">Borrar</button>
        </div>
      </div>
    ))}</div>}
    {(showCreate||editing)&&<ProductFormModal product={editing} auth={auth} onClose={()=>{setShowCreate(false);setEditing(null);}} onSaved={()=>{setShowCreate(false);setEditing(null);fetch();}}/>}
  </div>;
}

// ─── Product Form Modal (FULL) ─────────────────────────────────
function ProductFormModal({ product, auth, onClose, onSaved }: { product: VendorProduct|null; auth: Record<string,string>; onClose: ()=>void; onSaved: ()=>void }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCats, setSelectedCats] = useState<number[]>(product?.categories?.map(c=>c.id)||[]);
  const [images, setImages] = useState<ProductImage[]>(product?.images||[]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

  useEffect(() => { window.fetch(`${API}/vendor/categories`,{headers:auth}).then(r=>r.json()).then(d=>setCategories(d.categories||[])); }, [auth]);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("image", file); fd.append("featured", images.length===0?"true":"false");
    // Use product ID if editing, otherwise create first then upload
    if (isEdit) {
      const r = await fetch(`${API}/vendor/products/${product!.id}/images`, { method: "POST", headers: { Authorization: auth.Authorization }, body: fd });
      const d = await r.json();
      if (d.url) setImages(prev => [...prev, { id: d.image_id, url: d.url, featured: d.featured }]);
    } else {
      setError("Creá el producto primero, luego agregá imágenes en la edición.");
    }
    setUploading(false);
  };

  const removeImage = async (imgId: number) => {
    if (!isEdit) { setImages(prev=>prev.filter(i=>i.id!==imgId)); return; }
    await fetch(`${API}/vendor/products/${product!.id}/images/${imgId}`, { method: "DELETE", headers: { Authorization: auth.Authorization } });
    setImages(prev=>prev.filter(i=>i.id!==imgId));
  };

  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true);
    const f = new FormData(e.currentTarget);
    const body: Record<string,any> = {
      name: f.get("name"), status: f.get("status"), regular_price: f.get("regular_price"),
      sale_price: f.get("sale_price")||undefined, sku: f.get("sku"), description: f.get("description"),
      short_description: f.get("short_description"),
      manage_stock: f.get("manage_stock")==="1", stock_quantity: parseInt(f.get("stock_quantity") as string)||0,
      weight: f.get("weight"), dimensions: { length: f.get("length"), width: f.get("width"), height: f.get("height") },
      categories: selectedCats,
    };
    try {
      const r = await fetch(isEdit?`${API}/vendor/products/${product!.id}`:`${API}/vendor/products`, { method: isEdit?"PUT":"POST", headers:auth, body:JSON.stringify(body) });
      if (!r.ok) { const d=await r.json(); setError(d.message||"Error"); return; }
      onSaved();
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-full items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">{isEdit?"Editar":"Nuevo"} producto</h2><button onClick={onClose} className="text-black/30 hover:text-black text-lg">✕</button></div>
        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input name="name" required defaultValue={product?.name} placeholder="Nombre del producto *" className="rounded-xl border border-black/15 px-4 py-3 text-sm font-medium"/>

          {/* Price row */}
          <div className="grid grid-cols-3 gap-3">
            <input name="regular_price" type="number" step="0.01" required defaultValue={product?.price||""} placeholder="Precio *" className="rounded-xl border px-3 py-3 text-sm"/>
            <input name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price||""} placeholder="Oferta" className="rounded-xl border px-3 py-3 text-sm"/>
            <input name="sku" defaultValue={product?.sku||""} placeholder="SKU" className="rounded-xl border px-3 py-3 text-sm"/>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
              <input type="checkbox" name="manage_stock" value="1" defaultChecked={product?.manage_stock} className="rounded"/>
              <span className="text-black/60">Gestionar stock</span>
            </label>
            <input name="stock_quantity" type="number" defaultValue={product?.quantity||""} placeholder="Cantidad" className="rounded-xl border px-3 py-3 text-sm"/>
          </div>

          {/* Shipping */}
          <details className="rounded-xl border border-black/8 p-4"><summary className="text-sm font-semibold cursor-pointer text-black/50">📦 Envío (opcional)</summary>
            <div className="mt-3 grid grid-cols-4 gap-3">
              <input name="weight" defaultValue={product?.weight||""} placeholder="Peso (kg)" className="rounded-xl border px-3 py-2 text-sm"/>
              <input name="length" defaultValue={product?.dimensions?.length||""} placeholder="Largo (cm)" className="rounded-xl border px-3 py-2 text-sm"/>
              <input name="width" defaultValue={product?.dimensions?.width||""} placeholder="Ancho (cm)" className="rounded-xl border px-3 py-2 text-sm"/>
              <input name="height" defaultValue={product?.dimensions?.height||""} placeholder="Alto (cm)" className="rounded-xl border px-3 py-2 text-sm"/>
            </div>
          </details>

          {/* Description */}
          <textarea name="short_description" defaultValue={product?.short_description||""} placeholder="Descripción corta" rows={2} className="rounded-xl border px-4 py-3 text-sm"/>
          <textarea name="description" defaultValue={product?.description||""} placeholder="Descripción completa" rows={3} className="rounded-xl border px-4 py-3 text-sm"/>

          {/* Categories */}
          <details className="rounded-xl border border-black/8 p-4"><summary className="text-sm font-semibold cursor-pointer text-black/50">📂 Categorías ({selectedCats.length})</summary>
            <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {categories.map(c=>(
                <label key={c.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${selectedCats.includes(c.id)?"bg-[var(--color-accent)] text-white border-transparent":"border-black/10 text-black/50 hover:border-black/20"}`}>
                  <input type="checkbox" className="hidden" checked={selectedCats.includes(c.id)} onChange={()=>setSelectedCats(prev=>prev.includes(c.id)?prev.filter(x=>x!==c.id):[...prev,c.id])}/>
                  {c.name}
                </label>
              ))}
            </div>
          </details>

          {/* Images */}
          <div className="rounded-xl border border-black/8 p-4">
            <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-black/50">🖼️ Imágenes ({images.length})</span>
              <label className="cursor-pointer rounded-full bg-black/5 px-3 py-1 text-xs font-semibold hover:bg-black/10 transition">{uploading?"Subiendo...":"+ Agregar foto"}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading}/>
              </label>
            </div>
            {images.length>0 && <div className="flex gap-2 overflow-x-auto pb-2">{images.map(img=>(
              <div key={img.id} className="relative shrink-0 group">
                <img src={img.url} className="h-20 w-20 rounded-xl object-cover"/>
                {img.featured && <span className="absolute top-0.5 left-0.5 rounded-full bg-emerald-500 px-1.5 py-0 text-[0.55rem] font-bold text-white">★</span>}
                <button type="button" onClick={()=>removeImage(img.id)} className="absolute top-0.5 right-0.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            ))}</div>}
            <p className="text-[0.6rem] text-black/30 mt-1">Creá el producto primero y luego agregá imágenes desde la edición.</p>
          </div>

          {/* Status */}
          <select name="status" defaultValue={product?.status||"publish"} className="rounded-xl border px-4 py-3 text-sm">
            <option value="publish">Publicado</option><option value="draft">Borrador</option><option value="pending">Pendiente revisión</option>
          </select>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-black/50 hover:bg-black/5">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
              {loading?"Guardando...":isEdit?"Actualizar producto":"Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>;
}

// ─── Orders Tab ────────────────────────────────────────────────
function OrdersTab({ auth }: { auth: Record<string,string> }) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VendorOrder|null>(null);

  const fetch = useCallback(async () => {
    try { const r=await window.fetch(`${API}/vendor/orders`,{headers:auth}); const d=await r.json(); setOrders(d.orders||[]); } catch {} finally { setLoading(false); }
  }, [auth]);

  useEffect(()=>{fetch();},[fetch]);

  const statusColors: Record<string,string> = {completed:"bg-emerald-100 text-emerald-700",processing:"bg-blue-100 text-blue-700",pending:"bg-amber-100 text-amber-700","on-hold":"bg-orange-100 text-orange-700",cancelled:"bg-red-100 text-red-700",refunded:"bg-purple-100 text-purple-700"};
  const statusLabels: Record<string,string> = {completed:"Completado",processing:"En proceso",pending:"Pendiente","on-hold":"En espera",cancelled:"Cancelado",refunded:"Reembolsado"};

  if (selected) return <OrderDetail order={selected} auth={auth} onBack={()=>{setSelected(null);fetch();}}/>;

  return <div className="flex flex-col gap-4">
    {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-20 animate-pulse rounded-2xl bg-black/5"/>)}</div>
    : orders.length===0 ? <div className="reserved-slot min-h-[200px]"><div className="eyebrow w-fit">Sin órdenes</div></div>
    : <div className="flex flex-col gap-2">{orders.map(o=>(
      <button key={o.id} onClick={()=>setSelected(o)} className="text-left rounded-2xl border border-black/8 bg-white p-4 hover:border-black/12 transition w-full">
        <div className="flex items-center justify-between"><span className="text-sm font-bold">#{o.id}</span><span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${statusColors[o.status]||"bg-gray-100"}`}>{statusLabels[o.status]||o.status}</span></div>
        <div className="mt-1 flex justify-between text-xs text-black/40"><span>{o.date} · {o.customer}</span><span className="font-semibold text-black/70">{o.vendor_total.toFixed(2)} RSD</span></div>
        <p className="text-xs text-black/50 mt-1">{o.items.map(i=>`${i.qty}x ${i.name}`).join(", ")}</p>
      </button>
    ))}</div>}
  </div>;
}

function OrderDetail({ order, auth, onBack }: { order: VendorOrder; auth: Record<string,string>; onBack: ()=>void }) {
  const [updating, setUpdating] = useState(false);
  const markComplete = async () => {
    setUpdating(true);
    await window.fetch(`${API}/vendor/orders/${order.id}/status`, { method:"PUT", headers:auth, body:JSON.stringify({status:"completed"}) });
    setUpdating(false); onBack();
  };

  return <div className="flex flex-col gap-4">
    <button onClick={onBack} className="self-start text-sm text-black/50 hover:text-black">← Volver</button>
    <div className="rounded-2xl border border-black/8 bg-white p-6">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Orden #{order.id}</h2><span className="text-sm text-black/40">{order.date}</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <div><span className="text-black/40">Cliente:</span> {order.customer}</div>
        <div><span className="text-black/40">Pago:</span> {order.payment}</div>
        <div><span className="text-black/40">Estado:</span> <span className="font-semibold">{order.status}</span></div>
        <div><span className="text-black/40">Total tienda:</span> <span className="font-bold text-emerald-600">{order.vendor_total.toFixed(2)} RSD</span></div>
      </div>
      <div className="mt-4 border-t pt-4"><h3 className="text-sm font-semibold text-black/50 mb-2">Productos</h3>
        {order.items.map((it,i)=><div key={i} className="flex justify-between py-1 text-sm"><span>{it.qty}x {it.name}</span><span className="text-black/60">{it.total.toFixed(2)} RSD</span></div>)}
      </div>
      {order.status==="processing" && <button onClick={markComplete} disabled={updating} className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{updating?"Actualizando...":"Marcar como completado"}</button>}
    </div>
  </div>;
}

// ─── Coupons Tab ───────────────────────────────────────────────
function CouponsTab({ auth }: { auth: Record<string,string> }) {
  const [coupons, setCoupons] = useState<VendorCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetch = useCallback(async () => {
    try { const r=await window.fetch(`${API}/vendor/coupons`,{headers:auth}); const d=await r.json(); setCoupons(d.coupons||[]); } catch {} finally { setLoading(false); }
  }, [auth]);

  useEffect(()=>{fetch();},[fetch]);

  return <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between"><span className="text-sm text-black/50">{coupons.length} cupones</span><button onClick={()=>setShowForm(true)} className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-black">+ Nuevo cupón</button></div>
    {loading ? <div className="flex flex-col gap-3">{[1,2].map(i=><div key={i} className="h-16 animate-pulse rounded-2xl bg-black/5"/>)}</div>
    : coupons.length===0 ? <div className="reserved-slot min-h-[150px]"><p className="text-sm text-black/55">Sin cupones.</p></div>
    : <div className="flex flex-col gap-2">{coupons.map(c=>(<div key={c.id} className="flex items-center justify-between rounded-2xl border border-black/8 bg-white p-4">
      <div><p className="font-bold text-sm">{c.code}</p><p className="text-xs text-black/40">{c.discount_type==="percent"?`${c.amount}%`:`${c.amount} RSD`} · {c.usage}/{c.usage_limit||"∞"} usos{c.expires?` · Vence: ${c.expires}`:""}{c.min_amount>0?` · Mín: ${c.min_amount} RSD`:""}</p></div>
      <button onClick={async()=>{await window.fetch(`${API}/vendor/coupons/${c.id}`,{method:"DELETE",headers:auth});fetch();}} className="text-xs text-red-500 hover:underline">Eliminar</button>
    </div>))}</div>}
    {showForm && <CouponForm auth={auth} onClose={()=>setShowForm(false)} onSaved={()=>{setShowForm(false);fetch();}}/>}
  </div>;
}

function CouponForm({ auth, onClose, onSaved }: { auth: Record<string,string>; onClose: ()=>void; onSaved: ()=>void }) {
  const [loading,setLoading]=useState(false);
  const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setLoading(true);const f=new FormData(e.currentTarget);
    await window.fetch(`${API}/vendor/coupons`,{method:"POST",headers:auth,body:JSON.stringify({code:f.get("code"),amount:parseFloat(f.get("amount")as string)||0,discount_type:f.get("discount_type"),expiry_date:f.get("expiry_date")||null,minimum_amount:parseFloat(f.get("minimum_amount")as string)||0,usage_limit:parseInt(f.get("usage_limit")as string)||0})});onSaved();};
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
    <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Nuevo cupón</h2><button onClick={onClose} className="text-black/30 hover:text-black">✕</button></div>
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input name="code" required placeholder="Código (DESCUENTO10)" className="rounded-xl border px-4 py-3 text-sm"/>
      <div className="grid grid-cols-2 gap-3"><input name="amount" type="number" step="0.01" required placeholder="Valor" className="rounded-xl border px-3 py-3 text-sm"/>
        <select name="discount_type" className="rounded-xl border px-3 py-3 text-sm"><option value="percent">Porcentaje</option><option value="fixed_cart">Fijo carrito</option><option value="fixed_product">Fijo producto</option></select></div>
      <div className="grid grid-cols-2 gap-3"><input name="expiry_date" type="date" className="rounded-xl border px-3 py-3 text-sm"/><input name="usage_limit" type="number" placeholder="Límite de usos" className="rounded-xl border px-3 py-3 text-sm"/></div>
      <input name="minimum_amount" type="number" step="0.01" placeholder="Compra mínima (RSD)" className="rounded-xl border px-3 py-3 text-sm"/>
      <div className="flex gap-2 pt-2"><button type="button" onClick={onClose} className="flex-1 rounded-full border px-4 py-3 text-sm">Cancelar</button><button type="submit" disabled={loading} className="flex-1 rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white">{loading?"Creando...":"Crear cupón"}</button></div>
    </form>
  </div></div>;
}

// ─── Store Tab ─────────────────────────────────────────────────
function StoreTab({ auth }: { auth: Record<string,string> }) {
  const [store, setStore] = useState<StoreData|null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUp, setLogoUp] = useState(false);
  const [bannerUp, setBannerUp] = useState(false);

  useEffect(() => { window.fetch(`${API}/vendor/store`,{headers:auth}).then(r=>r.json()).then(d=>{setStore(d);setLoading(false);}); }, [auth]);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f)return; setLogoUp(true);
    const fd=new FormData(); fd.append("logo",f);
    const r=await fetch(`${API}/vendor/store/logo`,{method:"POST",headers:{Authorization:auth.Authorization},body:fd});
    const d=await r.json(); if(d.url) setStore(prev=>prev?{...prev,logo:d.url}:null); setLogoUp(false);
  };
  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f)return; setBannerUp(true);
    const fd=new FormData(); fd.append("banner",f);
    const r=await fetch(`${API}/vendor/store/banner`,{method:"POST",headers:{Authorization:auth.Authorization},body:fd});
    const d=await r.json(); if(d.url) setStore(prev=>prev?{...prev,banner:d.url}:null); setBannerUp(false);
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true); const f=new FormData(e.currentTarget);
    await fetch(`${API}/vendor/store`,{method:"PUT",headers:auth,body:JSON.stringify({
      store_name:f.get("store_name"),store_description:f.get("store_description"),store_email:f.get("store_email"),store_phone:f.get("store_phone"),
      address:{street_1:f.get("street"),city:f.get("city"),zip:f.get("zip"),country:f.get("country")},
      social:{facebook:f.get("facebook"),instagram:f.get("instagram")},
      policies:{shipping:f.get("policy_shipping"),refund:f.get("policy_refund"),cancellation:f.get("policy_cancel")},
      payment:{bank_account:f.get("bank"),paypal:f.get("paypal")},
    })});
    setEditing(false); setSaving(false);
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-black/5"/>;

  return <div className="flex flex-col gap-6">
    {!editing ? (<>
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer group">
          {store?.logo ? <img src={store.logo} className="h-20 w-20 rounded-2xl object-cover"/> : <div className="h-20 w-20 rounded-2xl bg-black/[0.03] flex items-center justify-center text-2xl">🏪</div>}
          <span className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition">Cambiar</span>
          <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={logoUp}/>
        </label>
        <div><h2 className="text-2xl font-bold">{store?.store_name}</h2><p className="text-sm text-black/50">{store?.store_description||"Sin descripción"}</p></div>
        <button onClick={()=>setEditing(true)} className="ml-auto rounded-full border border-black/10 px-4 py-2 text-xs font-semibold hover:bg-black/5">Editar</button>
      </div>
      <label className="relative cursor-pointer group">
        {store?.banner ? <img src={store.banner} className="h-40 w-full rounded-2xl object-cover"/> : <div className="h-32 rounded-2xl bg-black/[0.02] flex items-center justify-center text-black/15 text-sm">Click para agregar banner</div>}
        <input type="file" accept="image/*" className="hidden" onChange={uploadBanner} disabled={bannerUp}/>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Contacto" items={[["Email", store!.store_email || "—"],["Teléfono", store!.store_phone || "—"]]}/>
        <InfoCard label="Dirección" items={[["Calle", store!.address?.street_1 || "—"],["Ciudad", store!.address?.city || "—"],["CP", store!.address?.zip || "—"]]}/>
        <InfoCard label="Redes" items={[["Facebook", store!.social?.facebook || "—"],["Instagram", store!.social?.instagram || "—"]]}/>
        <InfoCard label="Pagos" items={[["Banco", store!.payment?.bank_account || "—"],["PayPal", store!.payment?.paypal || "—"]]}/>
        <InfoCard label="Políticas" items={[["Envíos", store!.policies?.shipping || "—"],["Reembolsos", store!.policies?.refund || "—"],["Cancelación", store!.policies?.cancellation || "—"]]}/>
      </div>
    </>) : (
      <form onSubmit={save} className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Editar tienda</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="store_name" defaultValue={store?.store_name} placeholder="Nombre *" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="store_email" defaultValue={ store?.store_email??""} placeholder="Email" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="store_phone" defaultValue={ store?.store_phone??""} placeholder="Teléfono / WhatsApp" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="street" defaultValue={ store?.address?.street_1??""} placeholder="Dirección" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="city" defaultValue={ store?.address?.city??""} placeholder="Ciudad" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="zip" defaultValue={ store?.address?.zip??""} placeholder="CP" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="facebook" defaultValue={ store?.social?.facebook??""} placeholder="Facebook URL" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="instagram" defaultValue={ store?.social?.instagram??""} placeholder="Instagram URL" className="rounded-xl border px-4 py-3 text-sm"/>
        </div>
        <textarea name="store_description" defaultValue={store?.store_description} placeholder="Descripción de la tienda" rows={3} className="rounded-xl border px-4 py-3 text-sm"/>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="bank" defaultValue={ store?.payment?.bank_account??""} placeholder="Cuenta bancaria" className="rounded-xl border px-4 py-3 text-sm"/>
          <input name="paypal" defaultValue={ store?.payment?.paypal??""} placeholder="PayPal email" className="rounded-xl border px-4 py-3 text-sm"/>
        </div>
        <details className="rounded-xl border border-black/8 p-4"><summary className="text-sm font-semibold cursor-pointer">📋 Políticas</summary>
          <div className="mt-3 flex flex-col gap-3">
            <textarea name="policy_shipping" defaultValue={ store?.policies?.shipping??""} placeholder="Envíos" rows={2} className="rounded-xl border px-4 py-3 text-sm"/>
            <textarea name="policy_refund" defaultValue={ store?.policies?.refund??""} placeholder="Reembolsos" rows={2} className="rounded-xl border px-4 py-3 text-sm"/>
            <textarea name="policy_cancel" defaultValue={ store?.policies?.cancellation??""} placeholder="Cancelación" rows={2} className="rounded-xl border px-4 py-3 text-sm"/>
          </div></details>
        <div className="flex gap-2"><button type="button" onClick={()=>setEditing(false)} className="flex-1 rounded-full border px-4 py-3 text-sm">Cancelar</button><button type="submit" disabled={saving} className="flex-1 rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white">{saving?"Guardando...":"Guardar"}</button></div>
      </form>
    )}
  </div>;
}

function InfoCard({ label, items }: { label: string; items: [string,string][] }) {
  return <div className="rounded-2xl border border-black/8 bg-white p-4"><p className="text-xs font-semibold uppercase text-black/35 mb-2">{label}</p>
    {items.map(([k,v])=><p key={k} className="text-sm"><span className="text-black/50">{k}: </span><span className="text-black/80">{v}</span></p>)}</div>;
}

// ─── Reports Tab ───────────────────────────────────────────────
function ReportsTab({ auth }: { auth: Record<string,string> }) {
  const [report, setReport] = useState<SalesReport|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.fetch(`${API}/vendor/reports/sales`,{headers:auth}).then(r=>r.json()).then(d=>{setReport(d);setLoading(false);}); },[auth]);

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-black/5"/>;

  return <div className="flex flex-col gap-6">
    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard label="Ventas" value={`${report?.total_sales?.toFixed(2)||"0"} RSD`} color="emerald"/>
      <StatCard label="Comisión (10%)" value={`${report?.commission?.toFixed(2)||"0"} RSD`} color="amber"/>
      <StatCard label="Neto" value={`${report?.net?.toFixed(2)||"0"} RSD`} color="blue"/>
      <StatCard label="Vendidos" value={`${report?.items_sold||0} uds.`} color="purple"/>
    </div>
    {report?.daily && report.daily.length > 0 && (
      <div className="rounded-2xl border border-black/8 bg-white p-5">
        <h3 className="text-sm font-semibold text-black/60 mb-4">Ventas diarias</h3>
        <div className="flex items-end gap-1 h-32">
          {report.daily.map((d,i)=>{ const max=Math.max(...report.daily.map(x=>x.amount),1); const h=Math.max(4,(d.amount/max)*100);
            return <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.amount} RSD`}>
              <span className="text-[0.55rem] text-black/30">{d.amount>0?Math.round(d.amount):""}</span>
              <div className="w-full rounded-t bg-[var(--color-accent)]" style={{height:`${h}%`,opacity:0.3+(h/100*0.7)}}/>
              <span className="text-[0.5rem] text-black/25">{d.date.slice(5)}</span>
            </div>;})}
        </div>
      </div>
    )}
  </div>;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string,string> = {emerald:"border-emerald-200 bg-emerald-50",amber:"border-amber-200 bg-amber-50",blue:"border-blue-200 bg-blue-50",purple:"border-purple-200 bg-purple-50"};
  const texts: Record<string,string> = {emerald:"text-emerald-700",amber:"text-amber-700",blue:"text-blue-700",purple:"text-purple-700"};
  return <div className={`rounded-2xl border p-4 ${colors[color]||""}`}><p className="text-xs font-semibold uppercase text-black/40">{label}</p><p className={`mt-1 text-xl font-bold ${texts[color]||"text-black"}`}>{value}</p></div>;
}
