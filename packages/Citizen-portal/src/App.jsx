import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandinPage from "./Components/LandingPage/LandingPage";
import Login from "./Components/LoginPage/login";
import SignUp from "./Components/SignUpPage/SignUpPage";
import Callback from "./auth/authCallBack";
import BottomTab from "./Navigation/Routes";
import TinyChat from "./Components/TinyChat";
import "./App.css";
import { useEffect } from "react";
import ResetPassword from "./Components/ResetPassword";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandinPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <TinyChat />
                  <BottomTab />
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
