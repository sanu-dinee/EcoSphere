import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import RegisterCollector from "../Components/registerCollector.jsx";
import "./council.css";
import IllegalDumpingReport from "../Components/illegalDump&pickupRequest.jsx";
import SchedulePickup from "../Components/schedulePickup.jsx";
import EvaluationInfo from "../Components/evaluation.jsx";
import NavBarDisplay from "../Components/navbar.jsx";
import Search from "../Components/searchCollector.jsx";

function CouncilDashboard() {
  const location = useLocation();

  const topRef = useRef(null);
  const submissionsRef = useRef(null);
  const scheduleRef = useRef(null);
  const collectorsRef = useRef(null);

  useEffect(() => {
    if (location.state?.scrollTarget) {
      const map = {
        top: topRef,
        submissions: submissionsRef,
        schedule: scheduleRef,
        collectors: collectorsRef,
      };

      const targetRef = map[location.state.scrollTarget];
      targetRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location]);

  return (
    <div className="dashboard-container">
      <div className="navbarD">
        <NavBarDisplay />
      </div>
      <div ref={topRef}></div>

      <table className="councilTable">
        <tbody>
          <tr>
            <td className="eInfo">
              <EvaluationInfo showGraph="graph1" />
            </td>
            <td className="eInfo1">
              <EvaluationInfo showGraph="graph2" />
            </td>
          </tr>

          <tr className="row2" ref={submissionsRef}>
            <td className="illegalDump">
              <IllegalDumpingReport />
            </td>
          </tr>

          <tr className="row3">
            <td className="schedule" ref={scheduleRef}>
              <SchedulePickup />
            </td>

            <td className="searchCollectors" ref={collectorsRef}>
              <Search />
            </td>

            <td className="registerCollector">
              <RegisterCollector />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CouncilDashboard;
