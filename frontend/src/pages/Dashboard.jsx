import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      <main className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome back, {user?.name || 'User'}!
          </p>
          <p className="text-gray-400 text-lg">Your content will appear here</p>
        </div>
      </main>
    </div>
  );
}