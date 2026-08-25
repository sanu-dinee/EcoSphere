import { useEffect } from "react";
import { handleAuthCallback } from "../services/authService";

export default function AuthCallback() {
  useEffect(() => {
    const resolveUser = async () => {
      try {
        const usertype = await handleAuthCallback();

        switch (usertype) {
          case 1:
            window.location.href = "http://localhost:2002/login";
            break;
          case 3:
            window.location.href = "http://localhost:2001/login";
            break;
          case 4:
            window.location.href = "http://localhost:2001/login";
            break;
          case 5:
            window.location.href = "http://localhost:2000/login";
            break;
          default:
            window.location.href = "/";
        }
      } catch (err) {
        console.error(err);
        window.location.href = "/login";
      }
    };

    resolveUser();
  }, []);

  return <p>Redirecting...</p>;
}
