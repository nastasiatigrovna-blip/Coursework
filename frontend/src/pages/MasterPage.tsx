import { FormEvent, useEffect, useState } from 'react';
import api from '../services/api';

const kinds = [{ type: 'ITEM', label: 'Изделие' }, { type: 'PATTERN', label: 'Схема' }, { type: 'VIDEO', label: 'Видео' }] as const;
const statusLabels: Record<string, string> = { PENDING: 'Ожидает проверки', APPROVED: 'Опубликована', REJECTED: 'Отклонена' };
type OptionDraft = { enabled: boolean; price: string; stock: string; fileUrl: string };
const emptyOptions: Record<string, OptionDraft> = { ITEM: { enabled: false, price: '', stock: '', fileUrl: '' }, PATTERN: { enabled: false, price: '', stock: '', fileUrl: '' }, VIDEO: { enabled: false, price: '', stock: '', fileUrl: '' } };

export default function MasterPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', imageUrl: '' });
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [options, setOptions] = useState<Record<string, OptionDraft>>(emptyOptions);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = async () => { const [cats, mine] = await Promise.all([api.get('/categories'), api.get('/products/mine')]); setCategories(cats.data); setWorks(mine.data); };
  useEffect(() => { load().catch(() => setError('Не удалось загрузить кабинет мастера.')); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    const payloadOptions = kinds.filter(({ type }) => options[type].enabled).map(({ type }) => ({ type, price: Number(options[type].price), stock: type === 'ITEM' ? (options[type].stock === '' ? null : Number(options[type].stock)) : null, fileUrl: type === 'ITEM' ? null : options[type].fileUrl }));
    if (!payloadOptions.length) { setError('Добавьте хотя бы один вариант покупки.'); return; }
    try {
      const result = await api.post('/products', { ...form, difficulty, categoryId: Number(form.categoryId), options: payloadOptions });
      setMessage(result.data.message); setForm({ name: '', description: '', categoryId: '', imageUrl: '' }); setOptions(emptyOptions); await load();
    } catch (e: any) { setError(e.response?.data?.message || 'Не удалось отправить работу.'); }
  };

  return <div className="mx-auto max-w-5xl space-y-10"><header><p className="text-sm font-medium uppercase tracking-widest text-orange-700">Кабинет мастера</p><h1 className="mt-2 font-serif text-4xl font-semibold">Мои работы</h1><p className="mt-2 text-stone-600">Добавьте карточку работы и отметьте варианты, которые покупатели смогут выбрать. Новая работа появится в каталоге после проверки администратора.</p></header>
    <form onSubmit={submit} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm md:p-8"><h2 className="font-serif text-2xl font-semibold">Добавить работу</h2>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Название<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Например, Мишка Тедди" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" /></label><label className="text-sm">Категория<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"><option value="">Выберите категорию</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
      <label className="block text-sm">Описание<textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" /></label>
      <label className="block text-sm">Ссылка на главное фото<input required type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" /></label>
      <label className="block text-sm">Сложность работы<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"><option value="BEGINNER">Начальный</option><option value="EASY">Лёгкий</option><option value="MEDIUM">Средний</option><option value="ADVANCED">Продвинутый</option><option value="EXPERT">Экспертный</option></select></label>
      <fieldset><legend className="mb-3 font-semibold">Варианты покупки и цены</legend><div className="grid gap-3 md:grid-cols-3">{kinds.map(({ type, label }) => <div key={type} className={`rounded-2xl border p-4 ${options[type].enabled ? 'border-orange-400 bg-orange-50' : 'border-stone-200'}`}><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={options[type].enabled} onChange={(e) => setOptions({ ...options, [type]: { ...options[type], enabled: e.target.checked } })} className="accent-orange-700" />{label}</label>{options[type].enabled && <><label className="mt-3 block text-sm">Цена, ₽<input required type="number" min="0" step="0.01" value={options[type].price} onChange={(e) => setOptions({ ...options, [type]: { ...options[type], price: e.target.value } })} placeholder="0 — бесплатно" className="mt-1 w-full rounded-xl border px-3 py-2" /></label>{type === 'ITEM' ? <label className="mt-3 block text-sm">Количество изделий (пусто — без ограничения)<input type="number" min="0" value={options[type].stock} onChange={(e) => setOptions({ ...options, ITEM: { ...options.ITEM, stock: e.target.value } })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label> : <label className="mt-3 block text-sm">Ссылка на {type === 'PATTERN' ? 'PDF-схему' : 'видео'}<input type="url" value={options[type].fileUrl} onChange={(e) => setOptions({ ...options, [type]: { ...options[type], fileUrl: e.target.value } })} placeholder="Можно добавить позже" className="mt-1 w-full rounded-xl border px-3 py-2" /></label>}</>}</div>)}</div></fieldset>
      {message && <p className="text-emerald-700">{message}</p>}{error && <p className="text-rose-600">{error}</p>}
      <button className="rounded-full bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800">Отправить на модерацию</button>
    </form>
    <section><h2 className="mb-4 font-serif text-2xl font-semibold">Отправленные работы</h2><div className="space-y-3">{works.map((work) => <article key={work.id} className="flex items-center gap-4 rounded-2xl bg-white p-4"><img src={work.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="flex-1"><h3 className="font-semibold">{work.name}</h3><p className="text-sm text-stone-500">{work.options.map((option: any) => `${kinds.find((k) => k.type === option.type)?.label}: ${option.price} ₽`).join(' · ')}</p>{work.moderationNote && <p className="mt-1 text-sm text-rose-600">Комментарий: {work.moderationNote}</p>}</div><span className="rounded-full bg-stone-100 px-3 py-1 text-sm">{statusLabels[work.status]}</span></article>)}{works.length === 0 && <p className="text-stone-500">Пока работ нет.</p>}</div></section>
  </div>;
}
