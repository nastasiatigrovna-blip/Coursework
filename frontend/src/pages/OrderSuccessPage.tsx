import { Link } from 'react-router-dom';

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
      <h1 className="mt-5 font-serif text-3xl font-semibold text-stone-900">Заказ оформлен</h1>
      <p className="mt-3 leading-7 text-stone-600">
        Спасибо за заказ! Цифровые материалы доступны в личном кабинете, а информация об изделии сохранена в истории заказов.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/profile" className="rounded-full bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800">Открыть личный кабинет</Link>
        <Link to="/catalog" className="rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-700 hover:bg-stone-50">Вернуться в каталог</Link>
      </div>
    </div>
  );
}
