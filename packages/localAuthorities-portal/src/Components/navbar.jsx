import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/images/logo.png";
import user from "../assets/images/userN (2).png";
import "./navbar.css";

function NavBar() {
  const navigate = useNavigate();

  const gotoProfile = () => {
    navigate("/viewProfile");
  };

  const goToCouncil = (scrollTarget) => {
    navigate("/council", { state: { scrollTarget } });
  };

  return (
    <div className="NavBar">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <a className="navbar-brand">
            <img src={logo} className="logo" alt="logo" />
            Local Authorities Portal
          </a>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto items">
              <li className="nav-item item">
                <a
                  className="nav-link"
                  onClick={() => goToCouncil("collectors")}
                >
                  SUBMISSIONS
                </a>
              </li>

              <li className="nav-item item">
                <a className="nav-link" onClick={() => goToCouncil("schedule")}>
                  SCHEDULE
                </a>
              </li>

              <li className="nav-item item">
                <a
                  className="nav-link"
                  onClick={() => goToCouncil("collectors")}
                >
                  COLLECTORS
                </a>
              </li>

              <li className="nav-item item" onClick={() => goToCouncil("top")}>
                <a className="nav-link" onClick={() => goToCouncil("top")}>
                  OVERVIEW
                </a>
              </li>

              <li className="nav-item item imageNew">
                <a className="image">
                  <img src={user} alt="user icon" onClick={gotoProfile} />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
