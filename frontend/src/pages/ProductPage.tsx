import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Product, ProductOption } from '../types';

const labels: Record<ProductOption['type'], string> = { ITEM: 'Изделие', PATTERN: 'Схема', VIDEO: 'Видео' };
const difficultyLabels: Record<string, string> = { BEGINNER: 'Начальный', EASY: 'Лёгкий', MEDIUM: 'Средний', ADVANCED: 'Продвинутый', EXPERT: 'Экспертный' };

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) api.get(`/products/${id}`).then(({ data }) => setProduct(data)).catch(() => setError('Не удалось загрузить работу. Возможно, она ещё проходит модерацию.'));
  }, [id]);

  const total = useMemo(() => product?.options
    .filter((option) => selected.includes(option.id))
    .reduce((sum, option) => sum + Number(option.price), 0) ?? 0, [product, selected]);

  const addToCart = () => {
    if (!product || selected.length === 0) {
      setError('Выберите хотя бы один вариант покупки.');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const key = [...selected].sort((a, b) => a - b).join(',');
    const existing = cart.find((item: any) => item.productId === product.id && [...(item.optionIds || [])].sort((a: number, b: number) => a - b).join(',') === key);
    if (existing) existing.quantity += quantity;
    else cart.push({ productId: product.id, optionIds: selected, quantity, product });
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  if (error && !product) return <div className="rounded-xl bg-white p-8 text-center text-rose-600">{error}</div>;
  if (!product) return <div className="py-16 text-center text-stone-500">Загружаем работу…</div>;

  return (
    <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-sm md:grid md:grid-cols-2">
      <div className="min-h-80 bg-stone-100">
        <img src={product.imageUrl} alt={product.name} className="h-full max-h-[620px] min-h-80 w-full object-cover" />
      </div>
      <div className="p-6 md:p-10">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-orange-700">Работа мастера{product.owner?.name ? ` · ${product.owner.name}` : ''}</p>
        <h1 className="font-serif text-4xl font-semibold text-stone-900">{product.name}</h1>
        <p className="mt-4 leading-7 text-stone-600">{product.description}</p>
        <p className="mt-3 text-sm text-stone-500">Сложность: <strong>{difficultyLabels[product.difficulty]}</strong></p>

        <section className="mt-8" aria-labelledby="options-heading">
          <h2 id="options-heading" className="mb-3 text-lg font-semibold text-stone-900">Что вы хотите приобрести?</h2>
          <div className="space-y-3">
            {product.options.map((option) => {
              const checked = selected.includes(option.id);
              const unavailable = option.type === 'ITEM' && option.stock !== null && option.stock !== undefined && option.stock < 1;
              return (
                <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${checked ? 'border-orange-500 bg-orange-50' : 'border-stone-200 hover:border-orange-300'} ${unavailable ? 'cursor-not-allowed opacity-50' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={unavailable} onChange={() => setSelected((current) => checked ? current.filter((id) => id !== option.id) : [...current, option.id])} className="h-5 w-5 accent-orange-600" />
                  <span className="flex-1">
                    <span className="block font-semibold text-stone-900">{labels[option.type]}</span>
                    {option.type === 'ITEM' && option.stock != null && <span className="text-sm text-stone-500">{unavailable ? 'Нет в наличии' : `В наличии: ${option.stock}`}</span>}
                    {Number(option.price) === 0 && <span className="text-sm text-emerald-700">Бесплатно</span>}
                  </span>
                  <span className="font-semibold text-stone-900">{Number(option.price) === 0 ? '0 ₽' : `${Number(option.price).toLocaleString('ru-RU')} ₽`}</span>
                </label>
              );
            })}
          </div>
        </section>

        {selected.some((optionId) => product.options.find((option) => option.id === optionId)?.type === 'ITEM') && (
          <label className="mt-5 flex items-center gap-3 text-sm text-stone-700">
            Количество изделий
            <input type="number" min={1} max={product.options.find((option) => option.type === 'ITEM')?.stock ?? undefined} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className="w-20 rounded-xl border border-stone-300 px-3 py-2" />
          </label>
        )}

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
        <div className="mt-8 flex items-end justify-between border-t border-stone-200 pt-5">
          <div><p className="text-sm text-stone-500">Сумма выбранных вариантов</p><p className="text-3xl font-bold text-stone-900">{(total * quantity).toLocaleString('ru-RU')} ₽</p></div>
          <button onClick={addToCart} className="rounded-full bg-orange-700 px-6 py-3 font-semibold text-white transition hover:bg-orange-800">В корзину</button>
        </div>
      </div>
    </article>
  );
}
