import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import StatCard from "../../../components/shared/StatCard";
import api from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/authStore";

interface Employee {
  id: string;
  fullName: string;
  performanceRating?: number;
  tasksCompleted?: number;
  tasksPending?: number;
}

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const trainerDomain = user?.domain || "";

  const [domainEmployees, setDomainEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    avgPerformance: 0,
    tasksCompleted: 0,
    pendingReviews: 0,
  });

  // --------------------- LOAD REAL API DATA ---------------------
  useEffect(() => {
    loadTrainerStats();
  }, []);

  const loadTrainerStats = async () => {
    try {
      const res = await api.get("/user/all");

      // Filter employees under trainer domain
      const filtered = res.data.filter(
        (u: any) =>
          u.role === "employee" &&
          u.domain &&
          u.domain.toLowerCase().trim() === trainerDomain.toLowerCase().trim()
      );

      setDomainEmployees(
        filtered.map((u: any) => ({
          id: u.id,
          fullName: u.fullName,
          performanceRating: u.performanceRating || 0,
          tasksCompleted: u.tasksCompleted || 0,
          tasksPending: u.tasksPending || 0,
        }))
      );

      // ----------- CALCULATE STATS -----------
      const total = filtered.length;
      const avgPerf =
        filtered.reduce((acc: number, emp: any) => acc + (emp.performanceRating || 0), 0) /
        (total || 1);

      const completedTasks = filtered.reduce(
        (acc: number, emp: any) => acc + (emp.tasksCompleted || 0),
        0
      );

      const pendingReviews = filtered.reduce(
        (acc: number, emp: any) => acc + (emp.tasksPending || 0),
        0
      );

      setStats({
        totalEmployees: total,
        avgPerformance: parseFloat(avgPerf.toFixed(1)),
        tasksCompleted: completedTasks,
        pendingReviews: pendingReviews,
      });
    } catch (err) {
      console.error("Error loading trainer stats:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Trainer Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Managing {trainerDomain} domain employees
        </p>
      </div>

      {/* -------------------- STATS -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title="My Domain Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
          trend={{ value: 5, isPositive: true }}
        />

        <StatCard
          title="Avg Performance"
          value={`${stats.avgPerformance}/10`}
          icon={TrendingUp}
          color="green"
          trend={{ value: stats.avgPerformance, isPositive: stats.avgPerformance >= 5 }}
        />

        <StatCard
          title="Tasks Completed"
          value={stats.tasksCompleted}
          icon={CheckCircle}
          color="purple"
          trend={{ value: 10, isPositive: true }}
        />

        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Clock}
          color="orange"
          trend={{ value: stats.pendingReviews, isPositive: false }}
        />

      </div>

      {/* -------------------- RECENT EMPLOYEES -------------------- */}
      <Card glassmorphism>
        <CardHeader>
          <CardTitle>Recent Employee Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {domainEmployees.slice(0, 5).map((emp) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {emp.fullName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Performance: {emp.performanceRating}/10
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {emp.tasksCompleted} completed
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {emp.tasksPending} pending
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
