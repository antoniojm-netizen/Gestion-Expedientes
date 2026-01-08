
import React, { useState } from 'react';
import { CaseFile, Client, Opponent, EntityType } from '../types';
import { FilterIcon, SearchIcon, MoreHorizontalIcon, ExternalLinkIcon } from 'lucide-react';

interface Props {
  cases: CaseFile[];
  onSelect: (id: string) => void;
  clients: Client[];
  opponents: Opponent[];
  onViewEntity: (type: EntityType, id: string) => void;
}

const CaseList: React.FC<Props> = ({ cases, onSelect, clients, opponents, onViewEntity }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = cases.filter(c => {
    const clientNames = c.clienteIds.map(id => clients.find(cl => cl.id === id)?.nombre || '').join(' ').toLowerCase();
    const opponentNames = c.contrarioIds.map(id => opponents.find(op => op.id === id)?.nombre || '').join(' ').toLowerCase();
    
    return (
      c.numeroExpediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientNames.includes(searchTerm.toLowerCase()) ||
      opponentNames.includes(searchTerm.toLowerCase())
    );
  });

  const getStatusStyle = (status: CaseFile['estado']) => {
    switch (status) {
      case 'abierto': return 'bg-amber-100 text-amber-700';
      case 'archivado': return 'bg-slate-100 text-slate-600';
      case 'archivado provisionalmente': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const renderEntityLinks = (ids: string[], source: any[], type: EntityType) => {
    if (ids.length === 0) return '-';
    
    return (
      <div className="flex flex-wrap gap-1">
        {ids.map((id, index) => {
          const name = source.find(e => e.id === id)?.nombre;
          if (!name) return null;
          return (
            <React.Fragment key={id}>
              <button 
                onClick={(e) => { e.stopPropagation(); onViewEntity(type, id); }}
                className="text-slate-700 hover:text-amber-600 hover:underline transition-colors text-left"
              >
                {name}
              </button>
              {index < ids.length - 1 && <span className="text-slate-400">,</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Listado de Expedientes</h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nº, cliente o contrario..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <FilterIcon size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Expediente</th>
                <th className="px-6 py-4 font-semibold">Cliente(s)</th>
                <th className="px-6 py-4 font-semibold">Contrario(s)</th>
                <th className="px-6 py-4 font-semibold">Apertura</th>
                <th className="px-6 py-4 font-semibold">Procedimiento</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onSelect(c.id)}
                      className="font-bold text-amber-600 hover:text-amber-700 transition-colors underline-offset-4 hover:underline"
                    >
                      {c.numeroExpediente}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {renderEntityLinks(c.clienteIds, clients, 'cliente')}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {renderEntityLinks(c.contrarioIds, opponents, 'contrario')}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {c.fechaApertura}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {c.numeroProcedimiento || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap ${getStatusStyle(c.estado)}`}>
                      {c.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontalIcon size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron expedientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseList;
