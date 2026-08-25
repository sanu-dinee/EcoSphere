import { useEffect } from "react";

export default function LiveChatAI() {
  useEffect(() => {
    // Create the script element
    const script = document.createElement("script");
    script.src = "https://app.livechatai.com/embed.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-id", "cmir0nwvx0001jt048oxhamxl");

    // Append to body
    document.body.appendChild(script);

    // Cleanup when component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // nothing to render in React
}
