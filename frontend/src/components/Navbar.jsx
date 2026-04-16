import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData || userData === 'undefined' || userData === 'null') {
        return { name: 'User' };
      }
      return JSON.parse(userData);
    } catch (err) {
      console.error('Error parsing user data:', err);
      return { name: 'User' };
    }
  };
  
  const user = getUserData();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="bg-white shadow p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Admin Dashboard</h2>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">{user.name || 'Admin User'}</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Navbar;
