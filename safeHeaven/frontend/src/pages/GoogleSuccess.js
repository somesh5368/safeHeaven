import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function GoogleSuccess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Save token in localStorage
      localStorage.setItem("token", token);
      // Go to home
      navigate("/", { replace: true });
    } else {
      // Check if already logged in (token exists in storage)
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }

    setLoading(false);
  }, [navigate]);

  return (
    <p>
      {loading
        ? "🔄 Signing you in with Google..."
        : "✅ Redirecting you..."}
    </p>
  );
}

export default GoogleSuccess;
