import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Product, Category } from '../types';

const optionLabels: Record<string, string> = { ITEM: 'Изделие', PATTERN: 'Схема', VIDEO: 'Видео' };

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, search, difficulty, sort]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const params: any = { limit: 50 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      params.sort = sort;

      const { data } = await api.get('/products', { params });
      setProducts(data.products);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Каталог товаров</h1>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Поиск</label>
            <input type="text" placeholder="Название товара..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Категория</label>
            <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)} className="w-full rounded border border-gray-300 px-4 py-2">
              <option value="">Все категории</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Сложность</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded border border-gray-300 px-4 py-2">
              <option value="">Любая сложность</option><option value="BEGINNER">Начальный</option><option value="EASY">Лёгкий</option><option value="MEDIUM">Средний</option><option value="ADVANCED">Продвинутый</option><option value="EXPERT">Экспертный</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Сортировка</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full rounded border border-gray-300 px-4 py-2">
              <option value="newest">Сначала новые</option><option value="name">По названию</option><option value="difficulty">По сложности</option>
            </select>
          </div>
        </div>
      </div>

      {/* Товары */}
      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Товары не найдены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-xs text-stone-500">Сложность: {({ BEGINNER: 'Начальный', EASY: 'Лёгкий', MEDIUM: 'Средний', ADVANCED: 'Продвинутый', EXPERT: 'Экспертный' } as any)[product.difficulty]}</p>
                <div className="mt-3 flex flex-wrap gap-2">{product.options.map((option) => <span key={option.id} className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-800">{optionLabels[option.type]} · {Number(option.price).toLocaleString('ru-RU')} ₽</span>)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
