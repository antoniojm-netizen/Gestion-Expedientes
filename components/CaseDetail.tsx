
import React, { useState } from 'react';
import { 
  CaseFile, Client, Opponent, Lawyer, Solicitor, Court, 
  CaseType, ProcedureType, TimelineEvent, FinancialEntry, EntityType 
} from '../types';
import { 
  ArrowLeftIcon, SaveIcon, HistoryIcon, CreditCardIcon, 
  InfoIcon, FileTextIcon, PlusIcon, SparklesIcon, Trash2Icon,
  LightbulbIcon, LinkIcon, ExternalLinkIcon, XIcon, UserPlusIcon,
  LandmarkIcon, TagIcon, LayersIcon, UsersIcon, BriefcaseIcon, GavelIcon,
  FolderSyncIcon, ArrowRightLeftIcon, ArrowUpRightIcon
} from 'lucide-react';
import { summarizeCaseTimeline, suggestLegalStrategy } from '../geminiService';

interface Props {
  caseFile: CaseFile;
  allCases: CaseFile[]; // Necesario para la vinculación
  clients: Client[];
  opponents: Opponent[];
  lawyers: Lawyer[];
  solicitors: Solicitor[];
  courts: Court[];
  caseTypes: CaseType[];
  procedureTypes: ProcedureType[];
  onBack: () => void;
  onUpdate: (updated: CaseFile) => void;
  onViewEntity: (type: EntityType, id: string) => void;
  onSelectCase: (id: string) => void; // Para navegar a un expediente vinculado
  onAddNewCourt: (court: Court) => void;
  onAddNewCaseType: (type: CaseType) => void;
  onAddNewProcedureType: (type: ProcedureType) => void;
  onAddNewClient: (client: Client) => void;
  onAddNewOpponent: (opponent: Opponent) => void;
  onAddNewLawyer: (lawyer: Lawyer) => void;
  onAddNewSolicitor: (solicitor: Solicitor) => void;
}

const CaseDetail: React.FC<Props> = ({ 
  caseFile, allCases, clients, opponents, lawyers, solicitors, 
  courts, caseTypes, procedureTypes, onBack, onUpdate, onViewEntity, onSelectCase,
  onAddNewCourt, onAddNewCaseType, onAddNewProcedureType,
  onAddNewClient, onAddNewOpponent, onAddNewLawyer, onAddNewSolicitor
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'finances' | 'notes'>('info');
  const [formData, setFormData] = useState<CaseFile>(caseFile);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);

  // States for Quick-Add modals
  const [showQuickAdd, setShowQuickAdd] = useState<'court' | 'caseType' | 'procedureType' | 'client' | 'lawyer' | 'solicitor' | 'opponent' | 'linkCase' | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  const handleSave = () => {
    onUpdate(formData);
    alert("Expediente guardado correctamente.");
  };

  const handleAddTimeline = () => {
    const newEvent: TimelineEvent = {
      id: `ev-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      archivoLink: ''
    };
    setFormData({ ...formData, evolutivo: [...formData.evolutivo, newEvent] });
  };

  const handleAddFinance = () => {
    const newFinance: FinancialEntry = {
      id: `fin-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'gasto',
      descripcion: '',
      monto: 0
    };
    setFormData({ ...formData, cuentas: [...formData.cuentas, newFinance] });
  };

  const runAiSummary = async () => {
    if (formData.evolutivo.length === 0) {
      alert("No hay eventos en el evolutivo para analizar.");
      return;
    }
    setAiLoading(true);
    const result = await summarizeCaseTimeline(formData.evolutivo);
    setAiSummary(result);
    setAiLoading(false);
  };

  const runAiStrategy = async () => {
    setStrategyLoading(true);
    const result = await suggestLegalStrategy(formData);
    setAiStrategy(result);
    setStrategyLoading(false);
  };

  const addEntityId = (type: 'client' | 'opponent', id: string) => {
    if (!id) return;
    if (type === 'client') {
      if (formData.clienteIds.includes(id)) return;
      setFormData({...formData, clienteIds: [...formData.clienteIds, id]});
    } else {
      if (formData.contrarioIds.includes(id)) return;
      setFormData({...formData, contrarioIds: [...formData.contrarioIds, id]});
    }
  };

  const removeEntity = (type: 'client' | 'opponent', id: string) => {
    if (type === 'client') {
      setFormData({...formData, clienteIds: formData.clienteIds.filter(i => i !== id)});
    } else {
      setFormData({...formData, contrarioIds: formData.contrarioIds.filter(i => i !== id)});
    }
  };

  const handleLinkCase = (linkedId: string) => {
    if (!linkedId) return;
    const currentRelated = formData.relatedCaseIds || [];
    if (currentRelated.includes(linkedId)) return;
    const newCaseData = {...formData, relatedCaseIds: [...currentRelated, linkedId]};
    setFormData(newCaseData);
    setShowQuickAdd(null);
    onUpdate(newCaseData);
  };

  const removeLinkedCase = (linkedId: string) => {
    const newCaseData = {
      ...formData, 
      relatedCaseIds: (formData.relatedCaseIds || []).filter(id => id !== linkedId)
    };
    setFormData(newCaseData);
    onUpdate(newCaseData);
  };

  const handleQuickAdd = () => {
    if (!quickAddValue.trim()) return;
    const newId = `${showQuickAdd}-quick-${Date.now()}`;
    const baseEntity = {
      id: newId, 
      nombre: quickAddValue, 
      documento: '', 
      direccion: '', 
      localidad: '', 
      codigoPostal: '', 
      provincia: ''
    };
    
    if (showQuickAdd === 'court') {
      const newCourt: Court = { ...baseEntity, ciudad: '' };
      onAddNewCourt(newCourt);
      setFormData({...formData, juzgadoId: newId});
    } else if (showQuickAdd === 'caseType') {
      const newType: CaseType = { id: newId, nombre: quickAddValue };
      onAddNewCaseType(newType);
      setFormData({...formData, tipoExpedienteId: newId});
    } else if (showQuickAdd === 'procedureType') {
      const newType: ProcedureType = { id: newId, nombre: quickAddValue };
      onAddNewProcedureType(newType);
      setFormData({...formData, tipoProcedimientoId: newId});
    } else if (showQuickAdd === 'client') {
      const newClient: Client = { ...baseEntity };
      onAddNewClient(newClient);
      setFormData({...formData, clienteIds: [...formData.clienteIds, newId]});
    } else if (showQuickAdd === 'opponent') {
      const newOpp: Opponent = { ...baseEntity };
      onAddNewOpponent(newOpp);
      setFormData({...formData, contrarioIds: [...formData.contrarioIds, newId]});
    } else if (showQuickAdd === 'lawyer') {
      const newLawyer: Lawyer = { ...baseEntity, colegio: '', numeroColegiado: '' };
      onAddNewLawyer(newLawyer);
    } else if (showQuickAdd === 'solicitor') {
      const newSolicitor: Solicitor = { ...baseEntity, colegio: '', numeroColegiado: '' };
      onAddNewSolicitor(newSolicitor);
    }

    setQuickAddValue('');
    setShowQuickAdd(null);
  };

  const getQuickAddTitle = () => {
    switch(showQuickAdd) {
      case 'court': return 'Juzgado';
      case 'caseType': return 'Tipo de Expediente';
      case 'procedureType': return 'Tipo de Procedimiento';
      case 'client': return 'Cliente';
      case 'opponent': return 'Contrario';
      case 'lawyer': return 'Abogado';
      case 'solicitor': return 'Procurador';
      case 'linkCase': return 'Expediente Relacionado';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Link Case Modal */}
      {showQuickAdd === 'linkCase' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                   <ArrowRightLeftIcon size={20} className="text-amber-600" />
                   Vincular con Expediente
                </h4>
                <button onClick={() => setShowQuickAdd(null)} className="text-slate-400 hover:text-slate-600"><XIcon size={20}/></button>
             </div>
             <p className="text-xs text-slate-500 mb-4">Selecciona un expediente para crear un vínculo de referencia rápida. La relación será bidireccional.</p>
             <select 
               className="w-full p-3 border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-amber-500 outline-none"
               onChange={(e) => handleLinkCase(e.target.value)}
               defaultValue=""
             >
                <option value="" disabled>Buscar expediente...</option>
                {allCases
                  .filter(c => c.id !== formData.id && !(formData.relatedCaseIds || []).includes(c.id))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.numeroExpediente} - {clients.find(cl => cl.id === c.clienteIds[0])?.nombre || 'S/C'}
                    </option>
                  ))
                }
             </select>
             <div className="flex gap-3">
                <button onClick={() => setShowQuickAdd(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* Quick Add Entity Modal */}
      {showQuickAdd && showQuickAdd !== 'linkCase' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                   <PlusIcon size={20} className="text-amber-600" />
                   Añadir Nuevo {getQuickAddTitle()}
                </h4>
                <button onClick={() => setShowQuickAdd(null)} className="text-slate-400 hover:text-slate-600"><XIcon size={20}/></button>
             </div>
             <input 
               autoFocus
               type="text" 
               className="w-full p-3 border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-amber-500 outline-none" 
               placeholder={`Nombre del nuevo ${getQuickAddTitle()}...`}
               value={quickAddValue}
               onChange={e => setQuickAddValue(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
             />
             <div className="flex gap-3">
                <button onClick={handleQuickAdd} className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-xl hover:bg-amber-700 transition-colors">Crear</button>
                <button onClick={() => setShowQuickAdd(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeftIcon size={18} />
          <span>Volver al listado</span>
        </button>
        <div className="flex flex-wrap gap-3 justify-end">
          <button 
            onClick={runAiSummary}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <SparklesIcon size={18} />
            {aiLoading ? 'Analizando...' : 'Análisis IA'}
          </button>
          <button 
            onClick={runAiStrategy}
            disabled={strategyLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <LightbulbIcon size={18} />
            {strategyLoading ? 'Pensando...' : 'Sugerir Estrategia'}
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            <SaveIcon size={18} />
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2">Expediente Judicial</p>
              <h1 className="text-3xl font-bold">{formData.numeroExpediente}</h1>
              <div className="flex gap-6 mt-4 items-center">
                <span className="flex items-center gap-1 text-slate-400 text-sm"><ClockIcon size={14}/> Apertura: {formData.fechaApertura}</span>
                <div className="relative">
                  <select 
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value as any})}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide appearance-none cursor-pointer border-none focus:ring-2 focus:ring-amber-500 ${
                      formData.estado === 'abierto' ? 'bg-amber-500 text-white' : 
                      formData.estado === 'archivado' ? 'bg-slate-600 text-white' : 
                      'bg-orange-600 text-white'
                    }`}
                  >
                    <option value="abierto">ABIERTO</option>
                    <option value="archivado">ARCHIVADO</option>
                    <option value="archivado provisionalmente">ARCHIVADO PROVISIONALMENTE</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Procedimiento</p>
              <p className="font-mono text-xl">{formData.numeroProcedimiento || 'Pte. Asignar'}</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-100 px-8 bg-slate-50/50 overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<InfoIcon size={18}/>} label="General" />
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<HistoryIcon size={18}/>} label="Evolutivo" />
          <TabButton active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon={<CreditCardIcon size={18}/>} label="Cuentas" />
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<FileTextIcon size={18}/>} label="Notas" />
        </div>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <SectionTitle title="Partes del Proceso" />
                
                {/* Clientes */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Clientes</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.clienteIds.map(id => (
                      <div key={id} className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-sm border border-amber-100 group">
                        <button 
                          onClick={() => onViewEntity('cliente', id)}
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          {clients.find(c => c.id === id)?.nombre}
                          <ExternalLinkIcon size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button onClick={() => removeEntity('client', id)} className="hover:text-amber-900 ml-1 border-l border-amber-200 pl-1"><XIcon size={14}/></button>
                      </div>
                    ))}
                  </div>
                  <SelectFieldWithAction 
                    label="Seleccionar Cliente" 
                    value="" 
                    onChange={v => addEntityId('client', v)} 
                    options={clients.filter(c => !formData.clienteIds.includes(c.id))} 
                    onAction={() => setShowQuickAdd('client')}
                    icon={<UsersIcon size={16}/>}
                  />
                </div>

                {/* Abogados y Procuradores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectFieldWithAction 
                    label="Abogado Resp." 
                    value={formData.abogadoId} 
                    onChange={v => setFormData({...formData, abogadoId: v})} 
                    options={lawyers} 
                    onAction={() => setShowQuickAdd('lawyer')}
                    icon={<BriefcaseIcon size={16}/>}
                  />
                  <SelectFieldWithAction 
                    label="Procurador Resp." 
                    value={formData.procuradorId} 
                    onChange={v => setFormData({...formData, procuradorId: v})} 
                    options={solicitors} 
                    onAction={() => setShowQuickAdd('solicitor')}
                    icon={<GavelIcon size={16}/>}
                  />
                </div>

                {/* Contrarios */}
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Contrarios</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.contrarioIds.map(id => (
                      <div key={id} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm border border-slate-200 group">
                        <button 
                          onClick={() => onViewEntity('contrario', id)}
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          {opponents.find(o => o.id === id)?.nombre}
                          <ExternalLinkIcon size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button onClick={() => removeEntity('opponent', id)} className="hover:text-slate-900 ml-1 border-l border-slate-300 pl-1"><XIcon size={14}/></button>
                      </div>
                    ))}
                  </div>
                  <SelectFieldWithAction 
                    label="Seleccionar Contrario" 
                    value="" 
                    onChange={v => addEntityId('opponent', v)} 
                    options={opponents.filter(o => !formData.contrarioIds.includes(o.id))} 
                    onAction={() => setShowQuickAdd('opponent')}
                    icon={<UsersIcon size={16}/>}
                  />
                </div>

                {/* Expedientes Vinculados */}
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ArrowRightLeftIcon size={14} className="text-amber-600" />
                      Expedientes Relacionados
                    </label>
                    <button 
                      onClick={() => setShowQuickAdd('linkCase')}
                      className="text-amber-600 hover:text-amber-700 p-1 rounded-full hover:bg-amber-50 transition-colors"
                      title="Vincular otro expediente"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(formData.relatedCaseIds || []).map(id => {
                      const related = allCases.find(c => c.id === id);
                      if (!related) return null;
                      return (
                        <div key={id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl group hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                          <button 
                            onClick={() => onSelectCase(id)}
                            className="flex items-center gap-3 text-sm text-slate-700 hover:text-amber-600 font-semibold group/link"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/link:text-amber-500 group-hover/link:border-amber-200 transition-colors">
                              <FolderSyncIcon size={16} />
                            </div>
                            <div className="text-left">
                               <p className="leading-tight">Exp. {related.numeroExpediente}</p>
                               <p className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Haga clic para navegar</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => onSelectCase(id)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Ir a expediente"
                            >
                              <ArrowUpRightIcon size={16} />
                            </button>
                            <button 
                              onClick={() => removeLinkedCase(id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar vínculo"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(!formData.relatedCaseIds || formData.relatedCaseIds.length === 0) && (
                      <div className="py-4 px-3 border border-dashed border-slate-200 rounded-xl text-center">
                         <p className="text-xs text-slate-400 italic">No hay expedientes vinculados.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionTitle title="Datos Judiciales" />
                <div className="space-y-4">
                  <SelectFieldWithAction 
                    label="Juzgado / Tribunal" 
                    value={formData.juzgadoId} 
                    onChange={v => setFormData({...formData, juzgadoId: v})} 
                    options={courts} 
                    onAction={() => setShowQuickAdd('court')}
                    icon={<LandmarkIcon size={16}/>}
                  />
                  <SelectFieldWithAction 
                    label="Tipo de Expediente" 
                    value={formData.tipoExpedienteId} 
                    onChange={v => setFormData({...formData, tipoExpedienteId: v})} 
                    options={caseTypes} 
                    onAction={() => setShowQuickAdd('caseType')}
                    icon={<TagIcon size={16}/>}
                  />
                  <SelectFieldWithAction 
                    label="Tipo de Procedimiento" 
                    value={formData.tipoProcedimientoId} 
                    onChange={v => setFormData({...formData, tipoProcedimientoId: v})} 
                    options={procedureTypes} 
                    onAction={() => setShowQuickAdd('procedureType')}
                    icon={<LayersIcon size={16}/>}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Número de Procedimiento</label>
                    <input 
                      type="text" 
                      value={formData.numeroProcedimiento} 
                      onChange={e => setFormData({...formData, numeroProcedimiento: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <SectionTitle title="Historial del Expediente" />
                <button onClick={handleAddTimeline} className="flex items-center gap-2 text-amber-600 font-medium hover:underline">
                  <PlusIcon size={18}/> Añadir Evento
                </button>
              </div>
              <div className="space-y-4">
                {formData.evolutivo.map((ev, idx) => (
                  <div key={ev.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex gap-4">
                    <div className="w-32 shrink-0">
                      <input 
                        type="date" 
                        value={ev.fecha} 
                        onChange={e => {
                          const newEv = [...formData.evolutivo];
                          newEv[idx].fecha = e.target.value;
                          setFormData({...formData, evolutivo: newEv});
                        }}
                        className="w-full p-2 text-sm bg-transparent border-none font-medium" 
                      />
                    </div>
                    <div className="flex-1">
                      <textarea 
                        placeholder="Descripción del evento..."
                        value={ev.descripcion}
                        onChange={e => {
                          const newEv = [...formData.evolutivo];
                          newEv[idx].descripcion = e.target.value;
                          setFormData({...formData, evolutivo: newEv});
                        }}
                        className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                        rows={2}
                      />
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, evolutivo: formData.evolutivo.filter(e => e.id !== ev.id)})}
                      className="text-slate-300 hover:text-red-500 p-2"
                    >
                      <Trash2Icon size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <SectionTitle title="Cuentas y Suplidos" />
                <button onClick={handleAddFinance} className="flex items-center gap-2 text-amber-600 font-medium hover:underline">
                  <PlusIcon size={18}/> Añadir Apunte
                </button>
              </div>
              <div className="bg-slate-50 rounded-2xl overflow-hidden shadow-inner">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3 text-right">Importe (€)</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formData.cuentas.map((fin, idx) => (
                      <tr key={fin.id}>
                        <td className="px-4 py-2">
                           <input type="date" value={fin.fecha} onChange={e => {
                             const n = [...formData.cuentas]; n[idx].fecha = e.target.value; setFormData({...formData, cuentas: n});
                           }} className="bg-transparent border-none p-1" />
                        </td>
                        <td className="px-4 py-2">
                           <select value={fin.tipo} onChange={e => {
                             const n = [...formData.cuentas]; n[idx].tipo = e.target.value as any; setFormData({...formData, cuentas: n});
                           }} className="bg-transparent border border-slate-300 rounded p-1">
                             <option value="ingreso">A cuenta</option>
                             <option value="gasto">Gasto</option>
                             <option value="suplido">Suplido</option>
                           </select>
                        </td>
                        <td className="px-4 py-2">
                           <input type="text" value={fin.descripcion} onChange={e => {
                             const n = [...formData.cuentas]; n[idx].descripcion = e.target.value; setFormData({...formData, cuentas: n});
                           }} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none p-1" placeholder="Descripción..." />
                        </td>
                        <td className="px-4 py-2 text-right">
                           <input type="number" value={fin.monto} onChange={e => {
                             const n = [...formData.cuentas]; n[idx].monto = Number(e.target.value); setFormData({...formData, cuentas: n});
                           }} className="w-24 bg-transparent text-right border-none p-1 font-bold" />
                        </td>
                        <td className="px-4 py-2 text-right">
                           <button onClick={() => setFormData({...formData, cuentas: formData.cuentas.filter(f => f.id !== fin.id)})} className="text-slate-400 hover:text-red-500">
                             <Trash2Icon size={16}/>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Balance Total</td>
                      <td className="px-4 py-3 text-right text-lg">
                        {formData.cuentas.reduce((acc, curr) => curr.tipo === 'ingreso' ? acc + curr.monto : acc - curr.monto, 0).toFixed(2)}€
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <SectionTitle title="Observaciones del Expediente" />
              <textarea 
                className="w-full h-96 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-inner"
                placeholder="Escribe aquí notas privadas, recordatorios o detalles adicionales..."
                value={formData.observaciones}
                onChange={e => setFormData({...formData, observaciones: e.target.value})}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{title: string}> = ({ title }) => (
  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{title}</h3>
);

const TabButton: React.FC<{active: boolean, onClick: () => void, label: string, icon: React.ReactNode}> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-4 flex items-center gap-2 font-medium transition-all relative ${
      active ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
    }`}
  >
    {icon}
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 rounded-t-full" />}
  </button>
);

const SelectFieldWithAction: React.FC<{
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  options: {id: string, nombre: string}[],
  onAction: () => void,
  icon: React.ReactNode
}> = ({ label, value, onChange, options, onAction, icon }) => (
  <div className="flex-1 min-w-0">
    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 truncate">{label}</label>
    <div className="flex gap-1.5">
      <div className="relative flex-1 min-w-0">
        <select 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none appearance-none truncate"
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.nombre}</option>
          ))}
        </select>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      </div>
      <button 
        onClick={onAction}
        className="p-1.5 bg-slate-50 border border-slate-200 text-amber-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  </div>
);

const ClockIcon: React.FC<{size?: number}> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default CaseDetail;
