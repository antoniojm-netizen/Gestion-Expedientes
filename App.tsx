
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderIcon, 
  UsersIcon, 
  GavelIcon, 
  Settings2Icon, 
  SearchIcon, 
  PlusIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  ScaleIcon,
  BriefcaseIcon,
  SparklesIcon,
  LandmarkIcon,
  TagsIcon,
  LayersIcon
} from 'lucide-react';
import { CaseFile, Client, Opponent, Lawyer, Solicitor, Court, CaseType, ProcedureType, EntityType, Entity } from './types';
import Dashboard from './components/Dashboard';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import EntityManagement from './components/EntityManagement';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'entities'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('cliente');
  const [entitySearchFilter, setEntitySearchFilter] = useState<string>('');

  // Initial dummy data
  const [clients, setClients] = useState<Client[]>([
    { id: 'c1', nombre: 'Juan Pérez', documento: '12345678A', observaciones: 'Cliente habitual', cuentaBancaria: 'ES12 3456 7890 1234 5678' },
    { id: 'c2', nombre: 'María García', documento: '87654321B', observaciones: 'Pendiente de provisión' }
  ]);
  const [opponents, setOpponents] = useState<Opponent[]>([
    { id: 'o1', nombre: 'Banco Falso S.A.', documento: 'A00000001', observaciones: 'Litigio complejo' }
  ]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([
    { id: 'l1', nombre: 'Alberto Ruiz', documento: '11223344C', numeroColegiado: '12345', colegio: 'ICAM Madrid' }
  ]);
  const [solicitors, setSolicitors] = useState<Solicitor[]>([
    { id: 's1', nombre: 'Lucía Pro', documento: '55667788D', numeroColegiado: '9876', colegio: 'ICPM Madrid' }
  ]);
  const [courts, setCourts] = useState<Court[]>([
    { id: 'ct1', nombre: 'Juzgado Primera Instancia nº 1', documento: 'MAD-01', ciudad: 'Madrid' }
  ]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([
    { id: 'cty1', nombre: 'Civil' }, 
    { id: 'cty2', nombre: 'Penal' },
    { id: 'cty3', nombre: 'Laboral' }
  ]);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([
    { id: 'pt1', nombre: 'Ordinario' }, 
    { id: 'pt2', nombre: 'Verbal' },
    { id: 'pt3', nombre: 'Monitorio' }
  ]);

  const [cases, setCases] = useState<CaseFile[]>([
    {
      id: 'case-1',
      numeroExpediente: '2024/1',
      fechaApertura: '2024-01-15',
      clienteIds: ['c1'],
      abogadoId: 'l1',
      procuradorId: 's1',
      contrarioIds: ['o1'],
      juzgadoId: 'ct1',
      tipoExpedienteId: 'cty1',
      tipoProcedimientoId: 'pt1',
      numeroProcedimiento: '123/2024',
      evolutivo: [
        { id: 'ev1', fecha: '2024-01-20', descripcion: 'Presentación de demanda', archivoLink: '#' }
      ],
      cuentas: [
        { id: 'fin1', fecha: '2024-01-25', tipo: 'ingreso', descripcion: 'Provisión de fondos', monto: 500 }
      ],
      observaciones: 'Caso de reclamación de cantidad.',
      estado: 'abierto',
      relatedCaseIds: []
    }
  ]);

  const handleUpdateCase = (updatedCase: CaseFile) => {
    setCases(prevCases => {
      const oldCase = prevCases.find(c => c.id === updatedCase.id);
      const oldRelated = oldCase?.relatedCaseIds || [];
      const newRelated = updatedCase.relatedCaseIds || [];

      // Detect changes to sync other cases
      const added = newRelated.filter(id => !oldRelated.includes(id));
      const removed = oldRelated.filter(id => !newRelated.includes(id));

      return prevCases.map(c => {
        // Current case
        if (c.id === updatedCase.id) return updatedCase;

        // If this case was added as related to the updated one, update its own related list
        if (added.includes(c.id)) {
          const currentRel = c.relatedCaseIds || [];
          if (!currentRel.includes(updatedCase.id)) {
            return { ...c, relatedCaseIds: [...currentRel, updatedCase.id] };
          }
        }

        // If relation was removed, remove the reciprocal link too
        if (removed.includes(c.id)) {
          return { ...c, relatedCaseIds: (c.relatedCaseIds || []).filter(id => id !== updatedCase.id) };
        }

        return c;
      });
    });
  };

  const handleCreateCase = () => {
    const year = new Date().getFullYear();
    const count = cases.filter(c => c.numeroExpediente.startsWith(year.toString())).length + 1;
    const newCase: CaseFile = {
      id: `case-${Date.now()}`,
      numeroExpediente: `${year}/${count}`,
      fechaApertura: new Date().toISOString().split('T')[0],
      clienteIds: [],
      abogadoId: '',
      procuradorId: '',
      contrarioIds: [],
      juzgadoId: '',
      tipoExpedienteId: '',
      tipoProcedimientoId: '',
      numeroProcedimiento: '',
      evolutivo: [],
      cuentas: [],
      observaciones: '',
      estado: 'abierto',
      relatedCaseIds: []
    };
    setCases([newCase, ...cases]);
    setSelectedCaseId(newCase.id);
    setActiveTab('cases');
  };

  const handleNavigateToEntity = (type: EntityType, entityId: string) => {
    let entity: Entity | undefined;
    if (type === 'cliente') entity = clients.find(c => c.id === entityId);
    if (type === 'contrario') entity = opponents.find(o => o.id === entityId);
    if (type === 'abogado') entity = lawyers.find(l => l.id === entityId);
    if (type === 'procurador') entity = solicitors.find(s => s.id === entityId);
    if (type === 'juzgado') entity = courts.find(ct => ct.id === entityId);

    if (entity) {
      setSelectedEntityType(type);
      setEntitySearchFilter(entity.nombre);
      setActiveTab('entities');
      setSelectedCaseId(null);
    }
  };

  const currentCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ScaleIcon className="text-amber-500 w-8 h-8" />
          <span className="font-bold text-xl tracking-tight">LegalCase Pro</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <NavItem 
            icon={<LayoutDashboardIcon size={20} />} 
            label="Panel de Control" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setSelectedCaseId(null); }}
          />
          <NavItem 
            icon={<FolderIcon size={20} />} 
            label="Expedientes" 
            active={activeTab === 'cases'} 
            onClick={() => { setActiveTab('cases'); setSelectedCaseId(null); }}
          />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Bases de Datos
          </div>
          <NavItem 
            icon={<UsersIcon size={20} />} 
            label="Clientes" 
            active={activeTab === 'entities' && selectedEntityType === 'cliente'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('cliente'); setEntitySearchFilter(''); }}
          />
          <NavItem 
            icon={<UsersIcon size={20} />} 
            label="Contrarios" 
            active={activeTab === 'entities' && selectedEntityType === 'contrario'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('contrario'); setEntitySearchFilter(''); }}
          />
          <NavItem 
            icon={<BriefcaseIcon size={20} />} 
            label="Abogados" 
            active={activeTab === 'entities' && selectedEntityType === 'abogado'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('abogado'); setEntitySearchFilter(''); }}
          />
          <NavItem 
            icon={<GavelIcon size={20} />} 
            label="Procuradores" 
            active={activeTab === 'entities' && selectedEntityType === 'procurador'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('procurador'); setEntitySearchFilter(''); }}
          />
          <NavItem 
            icon={<LandmarkIcon size={20} />} 
            label="Juzgados" 
            active={activeTab === 'entities' && selectedEntityType === 'juzgado'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('juzgado'); setEntitySearchFilter(''); }}
          />

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Configuración
          </div>
          <NavItem 
            icon={<TagsIcon size={20} />} 
            label="Tipos de Expediente" 
            active={activeTab === 'entities' && selectedEntityType === 'tipo_expediente'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('tipo_expediente'); setEntitySearchFilter(''); }}
          />
          <NavItem 
            icon={<LayersIcon size={20} />} 
            label="Tipos de Procedimiento" 
            active={activeTab === 'entities' && selectedEntityType === 'tipo_procedimiento'} 
            onClick={() => { setActiveTab('entities'); setSelectedEntityType('tipo_procedimiento'); setEntitySearchFilter(''); }}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={handleCreateCase}
             className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg shadow-amber-900/40"
           >
             <PlusIcon size={18} />
             Nuevo Expediente
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-slate-500">
             <span className="capitalize">{activeTab === 'entities' ? selectedEntityType.replace('_', ' ') : activeTab}</span>
             {selectedCaseId && (
               <>
                <ChevronRightIcon size={16} />
                <span className="font-semibold text-slate-900">Expediente {currentCase?.numeroExpediente}</span>
               </>
             )}
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar expediente..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all w-64"
                />
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                <img src="https://picsum.photos/32/32" alt="Avatar" />
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard 
              cases={cases} 
              onCaseSelect={(id) => { setSelectedCaseId(id); setActiveTab('cases'); }} 
            />
          )}
          
          {activeTab === 'cases' && !selectedCaseId && (
            <CaseList 
              cases={cases} 
              onSelect={setSelectedCaseId} 
              clients={clients}
              opponents={opponents}
              onViewEntity={handleNavigateToEntity}
            />
          )}

          {activeTab === 'cases' && selectedCaseId && currentCase && (
            <CaseDetail 
              caseFile={currentCase} 
              allCases={cases}
              clients={clients}
              opponents={opponents}
              lawyers={lawyers}
              solicitors={solicitors}
              courts={courts}
              caseTypes={caseTypes}
              procedureTypes={procedureTypes}
              onBack={() => setSelectedCaseId(null)}
              onUpdate={handleUpdateCase}
              onViewEntity={handleNavigateToEntity}
              onSelectCase={setSelectedCaseId}
              onAddNewCourt={(court) => setCourts([...courts, court])}
              onAddNewCaseType={(type) => setCaseTypes([...caseTypes, type])}
              onAddNewProcedureType={(type) => setProcedureTypes([...procedureTypes, type])}
              onAddNewClient={(client) => setClients([...clients, client])}
              onAddNewOpponent={(opponent) => setOpponents([...opponents, opponent])}
              onAddNewLawyer={(lawyer) => setLawyers([...lawyers, lawyer])}
              onAddNewSolicitor={(solicitor) => setSolicitors([...solicitors, solicitor])}
            />
          )}

          {activeTab === 'entities' && (
            <EntityManagement 
              type={selectedEntityType} 
              data={
                selectedEntityType === 'cliente' ? clients :
                selectedEntityType === 'contrario' ? opponents :
                selectedEntityType === 'abogado' ? lawyers :
                selectedEntityType === 'procurador' ? solicitors :
                selectedEntityType === 'juzgado' ? courts :
                selectedEntityType === 'tipo_expediente' ? (caseTypes as unknown as Entity[]) :
                (procedureTypes as unknown as Entity[])
              }
              onUpdate={(updatedData) => {
                if (selectedEntityType === 'cliente') setClients(updatedData as Client[]);
                if (selectedEntityType === 'contrario') setOpponents(updatedData as Opponent[]);
                if (selectedEntityType === 'abogado') setLawyers(updatedData as Lawyer[]);
                if (selectedEntityType === 'procurador') setSolicitors(updatedData as Solicitor[]);
                if (selectedEntityType === 'juzgado') setCourts(updatedData as Court[]);
                if (selectedEntityType === 'tipo_expediente') setCaseTypes(updatedData as unknown as CaseType[]);
                if (selectedEntityType === 'tipo_procedimiento') setProcedureTypes(updatedData as unknown as ProcedureType[]);
              }}
              onBackToCases={() => setActiveTab('cases')}
              initialSearch={entitySearchFilter}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
      active ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default App;
