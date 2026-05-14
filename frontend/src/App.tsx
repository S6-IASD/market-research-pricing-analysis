import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import HomePage from './pages/HomePage';
import ProductsListPage from './pages/ProductsListPage';
import AnalysisPage from './pages/AnalysisPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useTheme } from './context/ThemeContext';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/produits" element={<ProtectedRoute><ProductsListPage /></ProtectedRoute>} />
            <Route path="/analyse" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
}

export default App;
