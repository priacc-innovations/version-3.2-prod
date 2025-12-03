import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Trash2, Mail, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../api/axiosInstance';
import toast from "react-hot-toast";

interface HRMember {
  id: string;
  fullName: string;
  email: string;
  empid: string;
  role: string;
  createdAt: string;
}

interface TrainerMember {
  id: string;
  fullName: string;
  email: string;
  empid: string;
  role: string;
  domain: string;
  createdAt: string;
}

export default function HRManagement() {
  const [activeView, setActiveView] = useState<'hr' | 'trainer'>('hr');
  const [showAddForm, setShowAddForm] = useState(false);

  const [hrMembers, setHrMembers] = useState<HRMember[]>([]);
  const [trainers, setTrainers] = useState<TrainerMember[]>([]);

  const [showPassword, setShowPassword] = useState(false); // 👁️ Show/Hide Password

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    empid: '',
    password: '',
    domain: '',
  });

  // ------------------- LOAD MEMBERS -------------------
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await api.get("/user/all");

      const hr = res.data.filter((u: any) => u.role === "hr");
      const trainer = res.data.filter((u: any) => u.role === "trainer");

      setHrMembers(hr);
      setTrainers(trainer);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  };

  // ------------------- ADD HR / TRAINER -------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ❗ Email Restriction
    if (!formData.email.endsWith("@priaccinnovations.ai")) {
      toast.error("Email must end with @priaccinnovations.ai");
      return;
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      empid: formData.empid,
      password: formData.password,
      role: activeView === "hr" ? "hr" : "trainer",
      domain: activeView === "trainer" ? formData.domain : null
    };

    try {
      await api.post("/user/add", payload);

      toast.success(`${activeView === "hr" ? "HR" : "Trainer"} account created`);

      setShowAddForm(false);
      setFormData({ fullName: "", email: "", empid: "", password: "", domain: "" });
      loadMembers();
    } catch (err) {
      toast.error("Failed to create account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            HR & Trainer Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage HR staff and domain trainers
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <UserPlus className="w-5 h-5" />
          Add New {activeView === 'hr' ? 'HR' : 'Trainer'}
        </Button>
      </div>

      <div className="flex gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveView('hr')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeView === 'hr'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          HR Staff ({hrMembers.length})
        </button>

        <button
          onClick={() => setActiveView('trainer')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeView === 'trainer'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Trainers ({trainers.length})
        </button>
      </div>

      {/* ---------------- ADD FORM ---------------- */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Add New {activeView === 'hr' ? 'HR Staff' : 'Trainer'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <Input
                placeholder="Full Name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />

              <Input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                placeholder="Employee ID"
                required
                value={formData.empid}
                onChange={(e) => setFormData({ ...formData, empid: e.target.value })}
              />

              {/* PASSWORD WITH EYE ICON */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {activeView === 'trainer' && (
                <select
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Domain</option>
                  <option value="Java Developer">Java Developer</option>
                  <option value="Python Developer">Python Developer</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Frontend">Frontend</option>
                </select>
              )}

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Create Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Login credentials will be emailed to the user.
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ---------------- LIST HR ---------------- */}
      {activeView === 'hr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hrMembers.map((member) => (
            <Card key={member.id} glassmorphism>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {member.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        EmpID: {member.empid}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- LIST TRAINERS ---------------- */}
      {activeView === 'trainer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainers.map((trainer) => (
            <Card key={trainer.id} glassmorphism>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {trainer.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Mail className="w-4 h-4" />
                        {trainer.email}
                      </div>

                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mt-2">
                        {trainer.domain}
                      </span>

                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        EmpID: {trainer.empid}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
