import { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'materials'>('orders');
  const [role, setRole] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setRole(data.role)).catch(() => setRole(''));
    fetchOrders();
    fetchMaterials();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data } = await api.get('/users/my-materials');
      setMaterials(data);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>
      {role === 'MASTER' && <Link to="/master" className="mb-6 inline-block rounded-full bg-orange-700 px-5 py-2 text-white">Кабинет мастера →</Link>}

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 rounded ${
            activeTab === 'orders'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Мои заказы
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-2 rounded ${
            activeTab === 'materials'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Мои материалы
        </button>
      </div>

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p className="text-gray-500">У вас пока нет заказов</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="font-bold">Заказ №{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{order.totalPrice} ₽</p>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex items-center mb-2">
                      <span className="flex-1">{item.productName}</span>
                      <span className="text-gray-600">
                        {item.quantity} шт. × {item.price} ₽
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'materials' && (
        <div>
          {materials.length === 0 ? (
            <p className="text-gray-500">У вас пока нет купленных материалов</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.map((access) => (
                <div key={access.id} className="bg-white rounded-lg shadow-md p-6">
                  <img
                    src={access.product.imageUrl}
                    alt={access.product.name}
                    className="w-full h-32 object-cover rounded mb-4"
                  />
                  <h3 className="font-bold mb-2">{access.product.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Доступ получен: {new Date(access.grantedAt).toLocaleDateString()}
                  </p>
                  <div className="space-y-2">
                    {access.productOption.type === 'PATTERN' && access.productOption.fileUrl && (
                      <a
                        href={access.productOption.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600"
                      >
                        📄 Скачать PDF-схему
                      </a>
                    )}
                    {access.productOption.type === 'VIDEO' && access.productOption.fileUrl && (
                      <a
                        href={access.productOption.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-red-500 text-white text-center py-2 rounded hover:bg-red-600"
                      >
                        🎥 Смотреть видео
                      </a>
                    )}
                    {access.productOption.type === 'PATTERN' && !access.productOption.fileUrl && <p className="text-sm text-amber-700">Мастер добавит ссылку на схему</p>}
                    {access.productOption.type === 'VIDEO' && !access.productOption.fileUrl && <p className="text-sm text-amber-700">Мастер добавит ссылку на видео</p>}
                  </div>
                  <p className="mt-3 text-xs text-stone-500">Приобретено: {access.productOption.type === 'ITEM' ? 'изделие' : access.productOption.type === 'PATTERN' ? 'схема' : 'видеоурок'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
