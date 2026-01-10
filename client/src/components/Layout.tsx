import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/missions" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img 
                  src="/logo.png" 
                  alt="서울강북교회 청년회 로고" 
                  className="h-12 w-auto object-contain"
                  style={{ maxHeight: '38px' }}
                  onError={(e) => {
                    // 로고 이미지가 없으면 숨김
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-xl font-bold text-blue-600">서울강북교회 청년회</span>
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/missions"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/missions'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  미션
                </Link>
                <Link
                  to="/ranking"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/ranking'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  랭킹
                </Link>
                <Link
                  to="/mypage"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/mypage'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>마이페이지</span>
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.nickname}</span>
                <span className="ml-2 text-blue-600 font-semibold">
                  {user?.totalPoints.toLocaleString()}P
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="로그아웃"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

