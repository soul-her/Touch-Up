import { auth } from "../../firebase";
import { LogOut } from "lucide-react";

const ManagerHeader = ({ currentUser, setView }) => {
  const logout = async () => {
    await auth.signOut();
    setView?.("login");
  };

  return (
    <header className="px-6 md:px-8 py-4 flex items-center justify-between border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Welcome, {currentUser?.displayName || "Manager"}
        </h1>
        <p className="text-sm text-white/60">
          Inventory &amp; Operations Dashboard
        </p>
      </div>

      <button
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 hover:bg-red-500 px-4 py-2 font-semibold text-white transition shadow"
      >
        <LogOut size={18} />
        Logout
      </button>
    </header>
  );
};

export default ManagerHeader;
