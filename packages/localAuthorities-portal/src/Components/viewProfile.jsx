import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import "bootstrap/dist/css/bootstrap.min.css";
import logout from "../assets/images/New folder/logout.png";
import backI from "../assets/images/back-button.png";
import userI from "../assets/images/user (1).png";
import emailI from "../assets/images/email.png";
import camera from "../assets/images/camera.png";
import { supabase } from "../lib/supabaseClient";

function ViewProfile() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullname: "",
    username: "",
    contactnumber: "",
    email: "",
    userphotopath: "",
    extraInfo: "",
    passwordchangecode: "",
  });
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState(null);

  const gotoLogin = () => navigate("/login");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return navigate("/login");

      const uid = session.user.id;
      setUserId(uid);

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();

      if (error) throw error;
      setUserType(user.usertype);

      let extraField = "";
      let displayedName = "";

      if (user.usertype === 2 || user.usertype === 3) {
        const { data: councilData } = await supabase
          .from("council")
          .select("councilname, division")
          .eq("councilid", uid)
          .single();
        displayedName = councilData?.councilname;
        extraField = councilData?.division;
      } else if (user.usertype === 5) {
        const { data: storeData } = await supabase
          .from("partnerstore")
          .select("storename, location")
          .eq("storeid", uid)
          .single();
        displayedName = storeData?.storename;
        extraField = storeData?.location;
      } else if (user.usertype === 6) {
        const { data: coll } = await supabase
          .from("garbagecollector")
          .select("fullname, councilno")
          .eq("collectorid", uid)
          .single();

        displayedName = coll?.fullname;

        const { data: coun } = await supabase
          .from("council")
          .select("councilname")
          .eq("councilid", coll?.councilno)
          .single();
        extraField = coun?.councilname;
      }

      setProfileData({
        fullname: displayedName || user.fullname || "",
        username: user.username || "",
        contactnumber: user.contactnumber || "",
        email: user.email || "",
        userphotopath: user.userphotopath || "",
        passwordchangecode: user.passwordchangecode || "",
        extraInfo: extraField || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error: userErr } = await supabase
        .from("users")
        .update({
          username: profileData.username,
          contactnumber: profileData.contactnumber,
        })
        .eq("id", userId);

      if (userErr) throw userErr;

      if (userType === 5) {
        await supabase
          .from("partnerstore")
          .update({
            location: profileData.extraInfo,
            storename: profileData.fullname,
          })
          .eq("storeid", userId);
      }

      if (userType === 3) {
        await supabase
          .from("council")
          .update({
            councilname: profileData.fullname,
          })
          .eq("councilid", userId);
      }

      if (userType === 6) {
        await supabase
          .from("garbagecollector")
          .update({
            fullname: profileData.fullname,
          })
          .eq("collectorid", userId);
      }

      console.error("Profile Updated!");
      setIsEditing(false);
      fetchUserData();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handlePhotoChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setProfileData((prev) => ({
            ...prev,
            userphotopath: ev.target?.result,
          }));
        };
        reader.readAsDataURL(file);

        try {
          const fileExt = file.name.split(".").pop();
          const filePath = `${userId}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("users")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("users").getPublicUrl(filePath);

          await supabase
            .from("users")
            .update({ userphotopath: publicUrl })
            .eq("id", userId);

          console.error("Photo uploaded successfully!");
        } catch (error) {
          console.error("Upload error:", error);
          console.error("Error saving photo to server.");
        }
      }
    };
    input.click();
  };

  return (
    <div className="profileContainer">
      <div className="profileHeader">
        <p>Welcome, {profileData.fullname}</p>
        <div className="search-bar-and-avatar">
          <p className="current-date">{new Date().toDateString()}</p>
          <img
            src={backI}
            className="header-avatar"
            onClick={() => navigate(-1)}
            alt="back"
          />
          <img
            src={logout}
            className="logout"
            onClick={gotoLogin}
            alt="logout"
          />
        </div>
      </div>

      <div className="colorBar"></div>

      <div className="profile">
        <div className="profileLeft">
          <div className="image-container">
            <img
              src={profileData.userphotopath || userI}
              alt="Profile"
              className="profilePic"
            />
            <div
              className="change-photo-label"
              onClick={handlePhotoChange}
              style={{ cursor: "pointer" }}
            >
              <img src={camera} alt="camera" className="camera" />
            </div>
          </div>
          <div className="nm">
            <p className="profileName">{profileData.fullname}</p>
          </div>
          <div className="em">
            <p className="profileEmail">{profileData.email}</p>
          </div>
          <button
            className="editBtn"
            onClick={() => (isEditing ? handleUpdate() : setIsEditing(true))}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>

        <div className="profileRight">
          <div className="input-group">
            <label>Name</label>
            <input
              readOnly={!isEditing}
              className={isEditing ? "editable" : ""}
              value={profileData.fullname}
              onChange={(e) =>
                setProfileData({ ...profileData, fullname: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Username</label>
            <input
              readOnly={!isEditing}
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Contact Number</label>
            <input
              readOnly={!isEditing}
              value={profileData.contactnumber}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  contactnumber: e.target.value,
                })
              }
            />
          </div>

          <div className="input-group">
            <label>Password Change Code</label>
            <input
              type="text"
              value={profileData.passwordchangecode}
              readOnly
            />
          </div>

          <div className="input-group">
            <label>
              {userType === 3
                ? "Division"
                : userType === 5
                  ? "Location"
                  : "Service Council"}
            </label>
            <input
              readOnly={userType !== 5 || !isEditing}
              value={profileData.extraInfo}
              onChange={(e) =>
                setProfileData({ ...profileData, extraInfo: e.target.value })
              }
            />
          </div>

          <div className="email">
            <p className="email-heading">Email Address</p>
            <div className="emailCard">
              <img src={emailI} alt="email icon" className="email-icon" />
              <div className="email-details">
                <p className="email-address">{profileData.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewProfile;
