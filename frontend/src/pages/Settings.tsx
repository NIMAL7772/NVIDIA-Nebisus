
import { useState } from "react";
import {
  Settings as SettingsIcon,
  Package,
  BrainCircuit,
  User,
} from "lucide-react";

const tabs = [
  { name: "General", icon: SettingsIcon },
  { name: "Inventory", icon: Package },
  { name: "AI Configuration", icon: BrainCircuit },
  { name: "Profile", icon: User },
];

function Settings() {
  const [activeTab, setActiveTab] = useState("General");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your STOCK AI application preferences.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.name
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={17} />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-6">

          {activeTab === "General" && (
            <>
              <SectionHeading
                title="General Settings"
                description="Configure your company information."
              />

              <InputField label="Application Name" defaultValue="STOCK AI" />
              <InputField label="Company Name" placeholder="Enter company name" />
              <InputField label="Business Email" placeholder="Enter business email" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Currency
                </label>
                <select className="w-full md:w-1/2 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none">
                  <option>INR - Indian Rupee (₹)</option>
                  <option>USD - US Dollar ($)</option>
                  <option>EUR - Euro (€)</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "Inventory" && (
            <>
              <SectionHeading
                title="Inventory Preferences"
                description="Configure stock monitoring and alert thresholds."
              />

              <InputField
                label="Low Stock Threshold"
                defaultValue="15"
                type="number"
              />

              <InputField
                label="Default Reorder Quantity"
                defaultValue="50"
                type="number"
              />

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="font-medium text-slate-700 text-sm">
                    Low Stock Alerts
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Enable alerts when products reach the threshold.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700 text-sm">
                    Out of Stock Alerts
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Notify when a product has zero stock.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
              </div>
            </>
          )}

          {activeTab === "AI Configuration" && (
            <>
              <SectionHeading
                title="AI Configuration"
                description="Configure the AI model used by STOCK AI."
              />

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                <BrainCircuit className="text-blue-600" size={28} />
                <div>
                  <p className="font-semibold text-slate-800">NVIDIA Nemotron</p>
                  <p className="text-xs text-slate-500">
                    Planned AI provider for STOCK AI V2.
                  </p>
                </div>
              </div>

              <InputField
                label="Model Name"
                defaultValue="Nemotron"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AI Provider
                </label>
                <select className="w-full md:w-1/2 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none">
                  <option>NVIDIA</option>
                </select>
              </div>

              <p className="text-xs text-amber-600">
                API configuration will be handled securely through the backend.
                Do not enter API keys in this frontend form.
              </p>
            </>
          )}

          {activeTab === "Profile" && (
            <>
              <SectionHeading
                title="User Profile"
                description="Manage your administrator account information."
              />

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                  A
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Admin</p>
                  <p className="text-sm text-slate-500">Administrator</p>
                </div>
              </div>

              <InputField label="Full Name" defaultValue="Admin" />
              <InputField label="Email Address" placeholder="Enter email address" />
              <InputField label="Role" defaultValue="Administrator" />
            </>
          )}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Settings are currently displayed in demo mode. Persistent saving
              will be implemented through the backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

function InputField({
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full md:w-1/2 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

export default Settings;
