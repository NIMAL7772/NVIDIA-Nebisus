import { Search, Bell, ChevronDown } from "lucide-react";
interface NavbarProps {
  title: string;
}

function Navbar({ title }: NavbarProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">
  {title}
</h2>
        <p className="text-sm text-slate-500">
          Welcome back! Here's your inventory overview.
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent outline-none text-sm w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative text-slate-600 hover:text-blue-600">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            A
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Admin
            </p>
            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>

          <ChevronDown size={16} className="text-slate-400" />
        </div>

      </div>
    </header>
  );
}

export default Navbar;