import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CartItem, ProductOption } from '../types';

const labels: Record<ProductOption['type'], string> = { ITEM: 'Изделие', PATTERN: 'Схема', VIDEO: 'Видео' };

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      // Remove entries created by the old cart format. They do not contain options.
      const valid = Array.isArray(saved) ? saved.filter((item: CartItem) => item?.product?.options && Array.isArray(item.optionIds)) : [];
      if (valid.length !== saved.length) localStorage.setItem('cart', JSON.stringify(valid));
      return valid;
    } catch {
      localStorage.removeItem('cart');
      return [];
    }
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');
  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.product?.options ?? []).filter((option) => item.optionIds.includes(option.id)).reduce((line, option) => line + Number(option.price), 0) * item.quantity, 0), [cart]);
  const hasPhysical = cart.some((item) => (item.product?.options ?? []).some((option) => option.type === 'ITEM' && item.optionIds.includes(option.id)));

  const save = (updated: CartItem[]) => { setCart(updated); localStorage.setItem('cart', JSON.stringify(updated)); };
  const remove = (index: number) => save(cart.filter((_, itemIndex) => index !== itemIndex));
  const changeQuantity = (index: number, quantity: number) => save(cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, quantity) } : item));

  const checkout = async () => {
    setError('');
    if (!localStorage.getItem('token')) { setError('Войдите в аккаунт перед оформлением заказа.'); return; }
    if (!customerName.trim() || !customerPhone.trim()) { setError('Укажите имя и телефон.'); return; }
    if (hasPhysical && !deliveryAddress.trim()) { setError('Для доставки изделия укажите адрес.'); return; }
    try {
      await api.post('/orders', { items: cart.map((item) => ({ productId: item.productId, optionIds: item.optionIds, quantity: item.quantity })), customerName, customerPhone, deliveryAddress: deliveryAddress || null });
      localStorage.removeItem('cart');
      navigate('/order-success');
    } catch (e: any) { setError(e.response?.data?.message || 'Не удалось оформить заказ.'); }
  };

  if (!cart.length) return <div className="rounded-3xl bg-white p-12 text-center"><h1 className="font-serif text-3xl">Корзина пока пуста</h1><button onClick={() => navigate('/catalog')} className="mt-6 rounded-full bg-orange-700 px-6 py-3 text-white">Перейти в каталог</button></div>;

  return <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.5fr_1fr]">
    <section><h1 className="mb-6 font-serif text-4xl font-semibold">Корзина</h1><div className="space-y-4">
      {cart.map((item, index) => {
        const selectedOptions = item.product?.options.filter((option) => item.optionIds.includes(option.id)) ?? [];
        const lineTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price), 0) * item.quantity;
        return <article key={`${item.productId}-${item.optionIds.join('-')}-${index}`} className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm">
          <img src={item.product?.imageUrl} alt={item.product?.name} className="h-28 w-28 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{item.product?.name}</h2><p className="mt-2 text-sm text-stone-600">{selectedOptions.map((option) => `${labels[option.type]} — ${Number(option.price).toLocaleString('ru-RU')} ₽`).join(' · ')}</p>
            {selectedOptions.some((option) => option.type === 'ITEM') && <div className="mt-3 flex items-center gap-2"><button onClick={() => changeQuantity(index, item.quantity - 1)} className="h-8 w-8 rounded-full bg-stone-100">−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(index, item.quantity + 1)} className="h-8 w-8 rounded-full bg-stone-100">+</button></div>}
          </div><div className="text-right"><p className="font-bold">{lineTotal.toLocaleString('ru-RU')} ₽</p><button onClick={() => remove(index)} className="mt-3 text-sm text-rose-600">Удалить</button></div>
        </article>;
      })}
    </div></section>
    <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm"><h2 className="font-serif text-2xl font-semibold">Оформление</h2>
      <label className="mt-5 block text-sm">Имя<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" /></label>
      <label className="mt-4 block text-sm">Телефон<input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" /></label>
      {hasPhysical && <label className="mt-4 block text-sm">Адрес доставки<textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" /></label>}
      <div className="mt-6 flex justify-between border-t border-stone-200 pt-5 text-lg"><span>Итого</span><strong>{total.toLocaleString('ru-RU')} ₽</strong></div>
      <p className="mt-2 text-xs text-stone-500">Оплата демонстрационная. Цифровые материалы появятся в личном кабинете.</p>
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      <button onClick={checkout} className="mt-5 w-full rounded-full bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800">Оформить заказ</button>
    </aside>
  </div>;
}
