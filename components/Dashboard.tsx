
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CaseFile } from '../types';
import { BriefcaseIcon, CheckCircle2Icon, ClockIcon, WalletIcon, ChevronRightIcon, ArchiveRestoreIcon } from 'lucide-react';

interface Props {
  cases: CaseFile[];
  onCaseSelect: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ cases, onCaseSelect }) => {
  const openCases = cases.filter(c => c.estado === 'abierto').length;
  const closedCases = cases.filter(c => c.estado === 'archivado').length;
  const provClosedCases = cases.filter(c => c.estado === 'archivado provisionalmente').length;
  
  const stats = [
    { label: 'Expedientes Abiertos', value: openCases, icon: <BriefcaseIcon className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Archivado Provis.', value: provClosedCases, icon: <ArchiveRestoreIcon className="text-orange-500" />, color: 'bg-orange-50' },
    { label: 'Casos Finalizados', value: closedCases, icon: <CheckCircle2Icon className="text-green-500" />, color: 'bg-green-50' },
    { label: 'Pendiente de Cobro', value: '1,250€', icon: <WalletIcon className="text-purple-500" />, color: 'bg-purple-50' },
  ];

  const data = [
    { name: 'Ene', casos: 4 },
    { name: 'Feb', casos: 3 },
    { name: 'Mar', casos: 5 },
    { name: 'Abr', casos: cases.length },
  ];

  const pieData = [
    { name: 'Abiertos', value: openCases },
    { name: 'Archivados', value: closedCases },
    { name: 'Prov. Arch.', value: provClosedCases },
  ];

  const COLORS = ['#d97706', '#94a3b8', '#ea580c'];

  const getStatusStyle = (status: CaseFile['estado']) => {
    switch (status) {
      case 'abierto': return 'bg-amber-100 text-amber-700';
      case 'archivado': return 'bg-slate-100 text-slate-600';
      case 'archivado provisionalmente': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-4`}>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Actividad de Expedientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="casos" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Estado de Cartera</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-4 flex-wrap justify-center">
               {pieData.map((entry, i) => (
                 <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{entry.name}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Últimos Expedientes</h3>
          <button className="text-amber-600 text-sm font-medium hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nº Expediente</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.numeroExpediente}</td>
                  <td className="px-6 py-4 text-slate-500">{c.fechaApertura}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap ${getStatusStyle(c.estado)}`}>
                      {c.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onCaseSelect(c.id)}
                      className="text-slate-400 hover:text-amber-600 transition-colors"
                    >
                      <ChevronRightIcon size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
