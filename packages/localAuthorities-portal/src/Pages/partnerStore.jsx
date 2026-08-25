import './store.css';
import { useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import { Search, Loader2, User, Leaf, MinusCircle } from 'lucide-react';
import user from "../assets/images/user (1).png";
import { supabase } from "../lib/supabaseClient";

function StoreDashboard() {

 const navigate = useNavigate();
  const gotoProfile = () => {
    navigate("/viewProfile");
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [citizen, setCitizen] = useState(null);
  const [codes, setCodes] = useState([]);
  const [searched, setSearched] = useState(false);
  const [msg, setmsg] = useState("");
  const [codeNumber, setcodeNumber] = useState("");
  const [discountPrecentage, setdiscountPrecentage] = useState("");

  const normalizeText = (text) =>
    text.toLowerCase().trim().replace(/\s+/g, " ");

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCitizen(null);
    setCodes([]);
    setSearched(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Store not logged in");

      const storeId = session.user.id;
      const searchValue = normalizeText(searchTerm);

      let citizenData = null;

     
      const { data: citizenByName } = await supabase
        .from("citizen")
        .select("*")
        .ilike("fullname", searchValue)
        .maybeSingle();

      if (citizenByName) citizenData = citizenByName;

      
      if (!citizenData) {
        const { data: userByPhone } = await supabase
          .from("users")
          .select("id")
          .eq("contactnumber", searchValue)
          .maybeSingle();

        if (userByPhone) {
          const { data: citizenByUser } = await supabase
            .from("citizen")
            .select("*")
            .eq("citizenid", userByPhone.id)
            .maybeSingle();

          citizenData = citizenByUser;
        }
      }

      if (!citizenData) {
        setError("No citizen found for this name or number");
        return;
      }

      
      const { data: validCodes } = await supabase
        .from("validatepoints")
        .select("discountcode, discountissued")
        .eq("citizenno", citizenData.citizenid)
        .eq("storeno", storeId);

      if (!validCodes || validCodes.length === 0) {
        setError("No discount codes available for this store");
        return;
      }

      const codeNumbers = validCodes.map(v => v.discountcode);

      const { data: discounts } = await supabase
        .from("discountcodes")
        .select("codeno, discount")
        .in("codeno", codeNumbers);

      const mergedCodes = discounts.map(d => ({
        ...d,
        dateissued: validCodes.find(v => v.discountcode === d.codeno)?.discountissued
      }));

      setCitizen(citizenData);
      setCodes(mergedCodes);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCode = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Store not logged in");

      await supabase.from("discountcodes").insert({
        codeno: codeNumber,
        storeno: session.user.id,
        discount: discountPrecentage,
      });

      setcodeNumber("");
      setdiscountPrecentage("");
      setmsg("Discount code added");

    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <div className="store-dashboard">
      <h1 className="header">Eco-Loyalty Checkout System</h1>

      <div className='goProfile'>
        <img
          src={user}
          alt="user icon"
          className="userProfile"
          onClick={gotoProfile}
        />
      </div>

      <div className="content-grid">

       
        <div className="card search-panel">
          <h2 className="card-title">Citizen Lookup</h2>

          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              placeholder="Name or contact number"
              className="search-input"
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              onClick={handleSearch}
              disabled={loading}
              className="search-button"
            >
              {loading
                ? <Loader2 className="animate-spin" size={20} />
                : <Search size={20} />}
            </button>
          </div>

          {!searched && (
            <p className="no-citizen">
              Search to find a citizen profile 
            </p>
          )}

          {error && <p className="error-message">{error}</p>}

          {citizen && (
            <div className="profile-box">
              <div className="profile-details">
                <p className="profile-name">{citizen.fullname}</p>

                <div className="codes">
                  {codes.map((c) => (
                    <div key={c.codeno} className="code-row">
                      <p className="profile-code">{c.codeno}</p>
                      <p className="codePercentage">{c.discount}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

     
        <div className="card transaction-panel">
          <h2 className="card-title">Discounts Codes</h2>

          <div className='codeInsert'>
            <input
              type="text"
              className="codeInput"
              placeholder='Code No'
              value={codeNumber}
              onChange={(e) => setcodeNumber(e.target.value)}
            /><br/>

            <input
              type="text"
              className="codeInput"
              placeholder='Discount'
              value={discountPrecentage}
              onChange={(e) => setdiscountPrecentage(e.target.value)}
            /><br/>

            <button className='addCode' onClick={handleAddCode}>
              Add
            </button>
          </div>

          <p className="placeholder-text">Insert Discount Codes</p>
        </div>

        
        <div className="card history-panel">
          <h2 className="card-title">Citizen History</h2>

          <div className="history-details">
            {citizen && codes.map((c) => (
              <div key={c.codeno} className='history'>
                <p className='row1'>{citizen.fullname}</p>
                <p className='row1'>{c.dateissued}</p>
                <p className='row1'>{c.codeno}</p>
              </div>
            ))}

         {(!searched || error) && !citizen && (
        <p className='historyCommand'>
           History will appear after a search.
       </p>
        )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default StoreDashboard;