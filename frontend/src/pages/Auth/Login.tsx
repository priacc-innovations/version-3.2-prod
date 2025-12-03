import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../utils/authService";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { motion } from "framer-motion";
import { LogIn, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../../assests/teamhub-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = sessionStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    sessionStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.endsWith("@priaccinnovations.ai")) {
      setLoading(false);
      setError("Only @priaccinnovations.ai email is allowed.");
      toast.error("Only @priaccinnovations.ai email is allowed.");
      return;
    }

    try {
      const user = await authService.login(email, password);

      if (user && user.id) {
        sessionStorage.setItem("userId", String(user.id));

        setUser({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          empid: user.empid,
          role: user.role,
          photoUrl: user.photoUrl || "",
          domain: user.domain || "", // ⭐ REQUIRED
        });

        await refreshUser();

        toast.success(`Welcome ${user.fullName || ""}`);

        if (user.role === "admin") navigate("/admin");
        else if (user.role === "hr") navigate("/hr");
        else if (user.role === "trainer") navigate("/trainer");
        else navigate("/employee");
      } else {
        setError("Invalid credentials.");
        toast.error("Invalid credentials");
      }
    } catch (err) {
      setError("Invalid credentials or backend error.");
      toast.error("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <motion.div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl relative">

          <button
            onClick={toggleTheme}
            className="absolute top-5 right-5 bg-white dark:bg-gray-700 p-2 rounded-full shadow"
          >
            {theme === "light" ? <Moon /> : <Sun className="text-yellow-400" />}
          </button>

          <div className="text-center mb-8">
            <motion.img
              src={logo}
              alt="TeamHub Logo"
              className="w-24 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              TeamHub
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-red-500 text-center">{error}</p>}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

        </motion.div>
      </motion.div>
    </div>
  );
}
