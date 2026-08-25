import React, { useState, useEffect } from "react";
import "./registerCollector.css";
import usernameI from "../assets/images/user.png";
import name from "../assets/images/edit.png";
import passwordI from "../assets/images/padlock.png";
import contactNo from "../assets/images/old-typical-phone.png";
import eye from "../assets/images/eye.png";
import hidden from "../assets/images/hidden.png";
import emailI from "../assets/images/New folder/email.png";
import { supabase } from "../lib/supabaseClient";

function RegisterCollector({ adminCouncilId }) {
  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [usernameInput, setUsername] = useState("");
  const [passwordInput, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (passwordInput !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    let collectorId = null;

    try {
      const {
        data: { session: councilSession },
      } = await supabase.auth.getSession();

      if (!councilSession) throw new Error("Council not logged in");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: passwordInput,
        options: {
          data: { user_type: 6 },
        },
      });

      if (authError) throw authError;

      collectorId = authData.user.id;

      await supabase.auth.setSession({
        access_token: councilSession.access_token,
        refresh_token: councilSession.refresh_token,
      });

      await supabase.from("users").insert({
        id: collectorId,
        email,
        username: usernameInput,
        contactnumber: contactNumber,
        usertype: 6,
      });

      await supabase.from("garbagecollector").insert({
        collectorid: collectorId,
        fullname,
        councilno: councilSession.user.id,
      });

      setFullname("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setContactNumber("");

      setErrorMessage("Collector registered successfully");

      setFullname("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setContactNumber("");
    } catch (err) {
      setErrorMessage(err.message);

      setFullname("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setContactNumber("");
    } finally {
      setLoading(false);

      setFullname("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setContactNumber("");
    }
  };

  return (
    <div className="registerLogin">
      <h2>Register Garbage Collectors</h2>
      <form className="registerBox" onSubmit={handleRegister}>
        <div className="inputGroup">
          <img src={name} alt="Fullname" />
          <input
            type="text"
            placeholder="Fullname"
            onChange={(e) => setFullname(e.target.value)}
            required
          />
        </div>
        <div className="inputGroup">
          <img src={emailI} alt="email" />
          <input
            type="text"
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="inputGroup">
          <img src={usernameI} alt="Username" />
          <input
            type="text"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="inputGroup">
          <img src={passwordI} alt="Password" />
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <img
            className="toggleEye"
            src={show ? hidden : eye}
            alt="toggle"
            onClick={() => setShow(!show)}
          />
        </div>
        <div className="inputGroup">
          <img src={passwordI} alt="Confirm Password" />
          <input
            type={show1 ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <img
            className="toggleEye"
            src={show1 ? hidden : eye}
            alt="toggle"
            onClick={() => setShow1(!show1)}
          />
        </div>
        <div className="inputGroup">
          <img src={contactNo} alt="Contact Number" />
          <input
            type="text"
            placeholder="Contact Number"
            onChange={(e) => setContactNumber(e.target.value)}
            required
          />
        </div>
        <div className="buttonGroup">
          <button type="submit" className="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          <button type="button" className="cancelButton">
            Cancel
          </button>
        </div>
        <div className="collectorError">{errorMessage}</div>
      </form>
    </div>
  );
}

export default RegisterCollector;
