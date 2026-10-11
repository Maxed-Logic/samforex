import { Routes, Route } from 'react-router-dom';
import Home from '../Componenets/landing/Home';
import Signup from '../Pages/auth/Signup';
import Login from '../Pages/auth/Login';
import ForgotPassword from '../Pages/auth/ForgotPassword';

const LandingLayout = () => {
  return (
    <main className="landing-main">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        {/* ❌ <Route path="/dashboard" element={<Dashboard/>} />  <-- YE HATA DIYA */}
      </Routes>
    </main>
  );
};

export default LandingLayout;