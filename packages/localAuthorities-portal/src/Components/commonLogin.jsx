import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./commonLogin.css";
import memberLogin from "../assets/images/group.png";
import usernameI from "../assets/images/email.png";
import passwordI from "../assets/images/eye (1).png";
import showPasswordI from "../assets/images/hidden (1).png";
import { supabase } from "../lib/supabaseClient";

function CommonLoginComp() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [changeCode, setChangeCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const userId = data.user.id;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("usertype, email, contactnumber")
      .eq("id", userId)
      .single();

    if (userError) {
      setErrorMessage("User not found");
      return;
    }

    setErrorMessage("");

    switch (userData.usertype) {
      case 3:
        navigate("/council");
        break;

      case 4: {
        const { data: centerData, error: centerError } = await supabase
          .from("recyclecenter")
          .select("centername, location")
          .eq("centerid", userId)
          .single();

        if (centerError) {
          setErrorMessage("Recycle center not linked to this account");
          return;
        }

        const centerProfile = {
          centername: centerData.centername,
          location: centerData.location,
          email: userData.email,
          contactnumber: userData.contactnumber,
        };

        localStorage.setItem("center", JSON.stringify(centerProfile));
        navigate("/center-dashboard");
        break;
      }

      case 5:
        navigate("/store-dashboard");
        break;

      case 6:
        navigate("/collector-dashboard");
        break;

      default:
        setErrorMessage("No dashboard assigned for this user");
    }
  };

  const submitPasswordChange = async () => {
    if (!changeCode || !newPassword) {
      setErrorMsg("All fields are required");
      return;
    }

    const { error } = await supabase.from("passwordChangeRequest").insert({
      password: newPassword,
      changecode: changeCode,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Password change request submitted successfully");
      setChangeCode("");
      setNewPassword("");
      setTimeout(() => setShowPopup(false), 1500);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="member-icon-container">
          <img src={memberLogin} alt="member" className="member-icon" />
        </div>

        <h2 className="title">MEMBER LOGIN</h2>

        <form onSubmit={handleLogin} className="login-form">
          <div
            className="ErrorMessage"
            style={{ display: errorMessage ? "block" : "none", color: "red" }}
          >
            {errorMessage}
          </div>

          <div className="input-group">
            <img
              src={usernameI}
              alt="user icon"
              className="input-icon userIcon"
            />
            <input
              className="userI"
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <img
              className="input-icon password-toggle-icon"
              src={show ? showPasswordI : passwordI}
              alt="toggle password visibility"
              onClick={() => setShow(!show)}
              style={{ cursor: "pointer" }}
            />
            <input
              className="pass"
              type={show ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="signin-button">
            SIGN IN
          </button>

          <p className="forgot-password-link">
            Forgot Password?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowPopup(true);
              }}
            >
              Click Here
            </a>
          </p>
        </form>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h4>Change Password</h4>

            {errorMsg && <p className="errorMsg">{errorMsg}</p>}
            {successMsg && <p className="successMsg">{successMsg}</p>}

            <input
              type="text"
              placeholder="Password Change Code"
              value={changeCode}
              onChange={(e) => setChangeCode(e.target.value)}
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="popup-actions">
              <button className="rBtn" onClick={submitPasswordChange}>
                Request
              </button>
              <button className="rBtn" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommonLoginComp;
