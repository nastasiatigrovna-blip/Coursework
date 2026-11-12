import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const EMPTY_FORM = { email: '', password: '', name: '', accountType: 'USER' };

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [authError, setAuthError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem('token')) fetchUser();
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    if (showAuthModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAuthModal]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setAuthError('');
    setFormData(EMPTY_FORM);
  };

  const switchMode = () => {
    setIsLogin((v) => !v);
    setAuthError('');
    setFormData(EMPTY_FORM);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload: any = { email: formData.email, password: formData.password };
      if (!isLogin) {
        payload.name = formData.name;
        payload.accountType = formData.accountType;
      }
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      closeModal();
    } catch (error: any) {
      setAuthError(error.response?.data?.message || error.response?.data?.details || 'Произошла ошибка. Попробуйте ещё раз.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Клик по тёмному фону закрывает модалку
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal();
  };

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Рукодельница
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary">Главная</Link>
            <Link to="/catalog" className="text-gray-700 hover:text-primary">Каталог</Link>
            <Link to="/about" className="text-gray-700 hover:text-primary">О нас</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/cart" className="text-gray-700 hover:text-primary">🛒 Корзина</Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-gray-700 hover:text-primary">
                  👤 {user?.name}
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary">⚙️ Админ</Link>
                )}
                {user?.role === 'MASTER' && (
                  <Link to="/master" className="text-gray-700 hover:text-primary">🎨 Мои работы</Link>
                )}
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm">
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setIsLogin(true); }}
                className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuthModal && (
        // Тёмный фон — клик закрывает
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          {/* Карточка модалки */}
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
          >
            {/* Крестик */}
            <button
              onClick={closeModal}
              aria-label="Закрыть"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition text-lg"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {isLogin ? 'Вход' : 'Регистрация'}
            </h2>

            <form onSubmit={handleAuth} noValidate>
              {/* Поля только для регистрации */}
              {!isLogin && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">Имя</label>
                    <input
                      type="text"
                      placeholder="Как вас зовут?"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.accountType === 'MASTER'}
                        onChange={(e) =>
                          setFormData({ ...formData, accountType: e.target.checked ? 'MASTER' : 'USER' })
                        }
                        className="w-4 h-4 accent-orange-600"
                      />
                      <span className="text-sm text-gray-700">
                        Я мастер и хочу публиковать работы
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Email и пароль — общие */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="example@mail.ru"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-1">Пароль</label>
                <input
                  type="password"
                  placeholder={isLogin ? '••••••••' : 'Минимум 8 символов'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              {/* Ошибка */}
              {authError && (
                <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition"
              >
                {isLogin ? 'Войти' : 'Создать аккаунт'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={switchMode}
                className="text-sm text-orange-600 hover:text-orange-800 underline underline-offset-2"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
