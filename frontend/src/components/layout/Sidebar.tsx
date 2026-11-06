import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ChartNoAxesCombined,
  BrainCircuit,
  Settings,
  LogOut,
  Boxes,
  ClipboardList,
  Truck,
} from "lucide-react";



interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Inventory", icon: Package },
  { name: "Sales", icon: ShoppingCart },
  { name: "Purchase Orders", icon: ClipboardList },
  { name: "Suppliers", icon: Truck },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "AI Intelligence", icon: BrainCircuit },
];

  return (
    <aside className="w-64 min-h-screen bg-slate-950 text-white flex flex-col p-5">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Boxes size={25} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">STOCK AI</h1>
          <p className="text-xs text-slate-400">Inventory Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <p className="text-xs text-slate-500 uppercase mb-4">
          Main Menu
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                activePage === item.name
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-slate-800 pt-5 space-y-2">
        <button
          onClick={() => onNavigate("Settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
            activePage === "Settings"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Settings size={19} />
          Settings
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400">
          <LogOut size={19} />
          Logout
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
