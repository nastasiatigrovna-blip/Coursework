import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Product } from '../types';

const optionLabels: Record<string, string> = { ITEM: 'Изделие', PATTERN: 'Схема', VIDEO: 'Видео' };

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=6');
      setProducts(data.products);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    }
  };

  return (
    <div>
      {/* Hero секция */}
      <section className="bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-lg p-12 mb-12">
        <h1 className="text-5xl font-bold mb-4">Рукодельница</h1>
        <p className="text-xl mb-6">
          Маркетплейс для мастеров вязания. Изделия, схемы и видео мастер-классы в одном месте!
        </p>
        <Link
          to="/catalog"
          className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Смотреть каталог
        </Link>
      </section>

      {/* Новинки */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Новинки</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">{product.options.map((option) => <span key={option.id} className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-800">{optionLabels[option.type]} · {Number(option.price).toLocaleString('ru-RU')} ₽</span>)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">🧶</div>
          <h3 className="font-bold text-lg mb-2">Уникальные изделия</h3>
          <p className="text-gray-600">Готовые вязаные вещи ручной работы от мастеров</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="font-bold text-lg mb-2">Схемы и видео</h3>
          <p className="text-gray-600">PDF-схемы и видео мастер-классы для самостоятельного вязания</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="font-bold text-lg mb-2">Комплекты</h3>
          <p className="text-gray-600">Изделие + схема + видео в одной покупке</p>
        </div>
      </section>
    </div>
  );
}
