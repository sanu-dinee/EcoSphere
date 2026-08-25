import React, { useState } from "react";
import "./searchCollector.css";
import username from "../assets/images/user.png";
import { supabase } from "../lib/supabaseClient";

function SearchCollectors() {
  const [collectorName, setCollectorName] = useState("");
  const [fullname, setFullname] = useState("xxxxx xxxxx");
  const [username, setUsername] = useState("xxxxxxx");
  const [contact, setContact] = useState("xxx-xxxxxx");
  const [error, setError] = useState("");

  const normalizeText = (text) =>
    text.toLowerCase().trim().replace(/\s+/g, " ");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Council not logged in");

      const councilId = session.user.id;
      const searchName = normalizeText(collectorName);

      const { data: collectorData, error: collectorError } = await supabase
        .from("garbagecollector")
        .select("*")
        .ilike("fullname", searchName)
        .eq("councilno", councilId)
        .single();

      if (collectorError || !collectorData) {
        setError("No collector under the name");
        setCollectorName("");
        setUsername("xxxxxxxxxx");
        setFullname("xxxxxxxxxx");
        setContact("xxxxxxxxxx");
        return;
      }

      setFullname(collectorData.fullname);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username , contactnumber")
        .eq("id", collectorData.collectorid)
        .single();

      if (userError || !userData) {
        setUsername("xxxxxxx");
        setFullname("xxxxxxxxxx");
        setContact("xxxxxxxxxx");
      } else {
        setUsername(userData.username);
        setContact(userData.contactnumber);
      }
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };
  return (
    <div className="search">
      <h2 className="searchHeading">Get Garabge Collector Info</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          className="SearchC"
          placeholder={error ? error : "Search By Name"}
          value={collectorName}
          onChange={(e) => setCollectorName(e.target.value)}
        />
        <div className="searchDiv">
          <button type="submit" className="searchBtn">
            Search
          </button>
        </div>
      </form>
      <div className="collectorDetails">
        <label htmlFor="nameU" className="nameU">
          Name :
        </label>
        <label htmlFor="nameV" className="nameV">
          {fullname}
        </label>
        <br />

        <label htmlFor="userN" className="userN">
          Username :
        </label>
        <label htmlFor="us" className="us">
          {username}
        </label>
        <br />

        <label htmlFor="phone" className="phone">
          ContactNo :
        </label>
        <label className="contact" htmlFor="contact">
          {contact}
        </label>
      </div>
    </div>
  );
}

export default SearchCollectors;
