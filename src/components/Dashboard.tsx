import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, GraduationCap, CheckCircle2, LineChart } from "lucide-react";

export function Dashboard() {
  const trendData = [
    { semester: "Sem 1", avgCGPA: 7.2, target: 8.0 },
    { semester: "Sem 2", avgCGPA: 7.5, target: 8.0 },
    { semester: "Sem 3", avgCGPA: 7.1, target: 8.0 },
    { semester: "Sem 4", avgCGPA: 6.8, target: 8.0 },
    { semester: "Sem 5", avgCGPA: 7.4, target: 8.0 },
  ];

  const attendanceRiskData = [
    { department: "CS", safe: 400, risk: 45, critical: 12 },
    { department: "MECH", safe: 250, risk: 50, critical: 20 },
    { department: "ECE", safe: 320, risk: 30, critical: 5 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: "4,204", change: "+12%", up: true, icon: GraduationCap },
          { label: "Institution Avg CGPA", value: "7.34", change: "-0.2", up: false, icon: LineChart },
          { label: "At-Risk (Attendance)", value: "142", change: "+5", up: false, icon: AlertTriangle, alert: true },
          { label: "Communications Sent", value: "12.4k", change: "This month", up: true, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                <p className="text-2xl font-bold tracking-tight text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.alert ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`mt-4 flex items-center text-sm font-medium ${stat.up ? 'text-green-600' : 'text-amber-600'}`}>
              {stat.change && (stat.up ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />)}
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Institution CGPA Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Area type="monotone" dataKey="avgCGPA" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCgpa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Attendance Risk by Department</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceRiskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="safe" name="Safe (>75%)" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="risk" name="At Risk (60-75%)" stackId="a" fill="#f59e0b" />
                <Bar dataKey="critical" name="Critical (<60%)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl shadow-md p-6 text-white border border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <ArrowUpRight className="w-5 h-5 text-blue-300" />
          </div>
          <h3 className="font-semibold text-lg">AI System Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-blue-200 mb-1">Dropout Prevention</p>
            <p className="font-medium text-white text-sm">42 students identified in the 3rd semester showing correlation between declining math scores and continuous abscence. Recommended action: <strong>Automated Mentor Allocation</strong>.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-blue-200 mb-1">Performance Anomaly</p>
            <p className="font-medium text-white text-sm">Mechanical Eng department averages dropped by 0.6 CGPA points in "Fluid Dynamics". Suggest investigating faculty assessment rubrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
