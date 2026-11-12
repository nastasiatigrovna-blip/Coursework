import { useEffect, useState } from 'react';
import api from '../services/api';

const optionLabels: Record<string, string> = { ITEM: 'Изделие', PATTERN: 'Схема', VIDEO: 'Видео' };
const statusLabels: Record<string, string> = { PENDING: 'На проверке', APPROVED: 'Опубликована', REJECTED: 'Отклонена' };

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'moderation' | 'products' | 'orders'>('moderation');

  const load = async () => {
    const [all, orderData] = await Promise.all([api.get('/products/admin/all'), api.get('/orders')]);
    setProducts(all.data); setOrders(orderData.data.orders);
  };
  useEffect(() => { load().catch(console.error); }, []);

  const moderate = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    const note = status === 'REJECTED' ? window.prompt('Причина отклонения:', '') || '' : '';
    await api.patch(`/products/${id}/moderation`, { status, moderationNote: note });
    load();
  };
  const remove = async (id: number) => { if (window.confirm('Удалить работу?')) { await api.delete(`/products/${id}`); load(); } };
  const updateOrderStatus = async (id: number, status: string) => { await api.patch(`/orders/${id}/status`, { status }); load(); };

  return <div><h1 className="mb-8 font-serif text-4xl font-semibold">Административная панель</h1>
    <div className="mb-6 flex flex-wrap gap-3">{[['moderation', 'Модерация'], ['products', 'Все работы'], ['orders', 'Заказы']].map(([key, label]) => <button key={key} onClick={() => setActiveTab(key as any)} className={`rounded-full px-5 py-2 ${activeTab === key ? 'bg-orange-700 text-white' : 'bg-white text-stone-700'}`}>{label}</button>)}</div>
    {activeTab === 'moderation' && <div className="space-y-4">{products.filter((p) => p.status === 'PENDING').length === 0 ? <p className="rounded-2xl bg-white p-8 text-stone-500">Новых работ на проверку нет.</p> : products.filter((p) => p.status === 'PENDING').map((product) => <article key={product.id} className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm md:flex-row"><img src={product.imageUrl} alt={product.name} className="h-40 w-40 rounded-2xl object-cover" /><div className="flex-1"><p className="text-sm text-orange-700">Мастер: {product.owner?.name} · {product.owner?.email}</p><h2 className="mt-1 text-xl font-semibold">{product.name}</h2><p className="mt-2 text-stone-600">{product.description}</p><div className="mt-3 flex flex-wrap gap-2">{product.options.map((option: any) => <span key={option.id} className="rounded-full bg-stone-100 px-3 py-1 text-sm">{optionLabels[option.type]} · {Number(option.price).toLocaleString('ru-RU')} ₽</span>)}</div><div className="mt-5 flex gap-3"><button onClick={() => moderate(product.id, 'APPROVED')} className="rounded-full bg-emerald-600 px-5 py-2 text-white">Одобрить</button><button onClick={() => moderate(product.id, 'REJECTED')} className="rounded-full bg-rose-600 px-5 py-2 text-white">Отклонить</button></div></div></article>)}</div>}
    {activeTab === 'products' && <div className="overflow-x-auto rounded-3xl bg-white shadow-sm"><table className="w-full text-left"><thead className="bg-stone-100"><tr><th className="p-4">Работа</th><th className="p-4">Мастер</th><th className="p-4">Варианты</th><th className="p-4">Статус</th><th className="p-4">Действие</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-t border-stone-100"><td className="p-4 font-medium">{product.name}</td><td className="p-4">{product.owner?.name}</td><td className="p-4">{product.options.map((o: any) => `${optionLabels[o.type]}: ${o.price} ₽`).join(', ')}</td><td className="p-4">{statusLabels[product.status]}</td><td className="p-4"><button onClick={() => remove(product.id)} className="text-rose-600">Удалить</button></td></tr>)}</tbody></table></div>}
    {activeTab === 'orders' && <div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex justify-between"><div><h2 className="font-semibold">Заказ №{order.id}</h2><p className="text-sm text-stone-500">{order.user.name} · {order.user.email}</p></div><div className="text-right"><strong>{Number(order.totalPrice).toLocaleString('ru-RU')} ₽</strong><select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="ml-4 rounded-xl border p-2"><option value="PAID">Оплачен</option><option value="PROCESSING">В обработке</option><option value="SHIPPED">Отправлен</option><option value="DELIVERED">Доставлен</option><option value="CANCELLED">Отменён</option></select></div></div></article>)}</div>}
  </div>;
}
