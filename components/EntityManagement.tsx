
import React, { useState, useRef, useEffect } from 'react';
import { Entity, EntityType, Lawyer, Solicitor } from '../types';
import { 
  SearchIcon, PlusIcon, Edit2Icon, Trash2Icon, LandmarkIcon, 
  DownloadIcon, UploadIcon, TagIcon, LayersIcon, UsersIcon, 
  BriefcaseIcon, GavelIcon, PhoneIcon, MailIcon, MapPinIcon, InfoIcon,
  ArrowLeftIcon, FileTextIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  type: EntityType;
  data: Entity[];
  onUpdate: (data: Entity[]) => void;
  onBackToCases?: () => void;
  initialSearch?: string;
}

const EntityManagement: React.FC<Props> = ({ type, data, onUpdate, onBackToCases, initialSearch = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Entity | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const filteredData = data.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.documento && e.documento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = () => {
    const newEntity: any = {
      id: `${type}-${Date.now()}`,
      nombre: 'Nuevo ' + type.replace('_', ' '),
      documento: '',
      telefono: '',
      email: '',
      direccion: '',
      localidad: '',
      codigoPostal: '',
      provincia: '',
      cuentaBancaria: '',
      observaciones: ''
    };
    
    if (type === 'abogado' || type === 'procurador') {
      newEntity.colegio = '';
      newEntity.numeroColegiado = '';
    }

    onUpdate([...data, newEntity]);
    setEditingId(newEntity.id);
    setEditFormData(newEntity);
  };

  const handleSave = () => {
    if (editFormData) {
      onUpdate(data.map(e => e.id === editFormData.id ? editFormData : e));
      setEditingId(null);
      setEditFormData(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      onUpdate(data.filter(e => e.id !== id));
    }
  };

  // --- LOGICA DE EXPORTACION CSV ---
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "Nombre", "Documento", "Telefono", "Email", "Direccion", 
      "Localidad", "CP", "Provincia", "Cuenta Bancaria", "Observaciones"
    ];
    if (type === 'abogado' || type === 'procurador') {
      headers.push("Colegio", "Nº Colegiado");
    }

    const rows = filteredData.map(e => {
      const baseRow = [
        `"${e.nombre}"`,
        `"${e.documento || ''}"`,
        `"${e.telefono || ''}"`,
        `"${e.email || ''}"`,
        `"${e.direccion || ''}"`,
        `"${e.localidad || ''}"`,
        `"${e.codigoPostal || ''}"`,
        `"${e.provincia || ''}"`,
        `"${e.cuentaBancaria || ''}"`,
        `"${(e.observaciones || '').replace(/\n/g, ' ')}"`
      ];
      if (type === 'abogado' || type === 'procurador') {
        baseRow.push(`"${(e as any).colegio || ''}"`, `"${(e as any).numeroColegiado || ''}"`);
      }
      return baseRow.join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGICA DE EXPORTACION PDF ---
  const handleExportPDF = () => {
    if (filteredData.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    const title = `Base de Datos de ${type.replace('_', ' ').toUpperCase()}S`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = [
      "Nombre", "Documento", "Teléfono", "Email", "Ubicación", "Observaciones"
    ];
    if (type === 'abogado' || type === 'procurador') {
      headers.splice(2, 0, "Colegiado");
    }

    const tableData = filteredData.map(e => {
      const location = [e.direccion, e.codigoPostal, e.localidad, e.provincia].filter(Boolean).join(", ");
      const row = [
        e.nombre,
        e.documento || '-',
        e.telefono || '-',
        e.email || '-',
        location || '-',
        e.observaciones || '-'
      ];
      if (type === 'abogado' || type === 'procurador') {
        const colInfo = `${(e as any).numeroColegiado || ''} ${(e as any).colegio ? `(${ (e as any).colegio })` : ''}`;
        row.splice(2, 0, colInfo || '-');
      }
      return row;
    });

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'f', fillColor: [217, 119, 6], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        4: { cellWidth: 60 }
      }
    });

    doc.save(`export_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        alert("El archivo CSV parece estar vacío o no tener encabezados.");
        return;
      }

      const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      const newEntities: Entity[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].match(/(".*?"|[^";,]+|(?<=[;,])(?=[;,])|(?<=[;,])$|^$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
        
        const entry: any = {
          id: `${type}-import-${Date.now()}-${i}`,
          nombre: '',
          documento: '',
          telefono: '',
          email: '',
          direccion: '',
          localidad: '',
          codigoPostal: '',
          provincia: '',
          cuentaBancaria: '',
          observaciones: ''
        };

        if (type === 'abogado' || type === 'procurador') {
          entry.colegio = '';
          entry.numeroColegiado = '';
        }

        headers.forEach((header, index) => {
          const val = values[index] || '';
          if (header === 'nombre' || header === 'nombre completo' || header === 'razon social') entry.nombre = val;
          else if (header === 'documento' || header === 'dni' || header === 'nif' || header === 'cif' || header === 'identificador') entry.documento = val;
          else if (header === 'telefono' || header === 'tel' || header === 'movil') entry.telefono = val;
          else if (header === 'email' || header === 'correo' || header === 'mail') entry.email = val;
          else if (header === 'direccion' || header === 'postal' || header === 'calle') entry.direccion = val;
          else if (header === 'localidad' || header === 'ciudad' || header === 'pueblo' || header === 'municipio') entry.localidad = val;
          else if (header === 'cp' || header === 'codigo postal' || header === 'postal code' || header === 'zip') entry.codigoPostal = val;
          else if (header === 'provincia' || header === 'estado' || header === 'region') entry.provincia = val;
          else if (header === 'observaciones' || header === 'notas') entry.observaciones = val;
          else if (header === 'cuenta' || header === 'iban') entry.cuentaBancaria = val;
          else if (header === 'colegio') entry.colegio = val;
          else if (header === 'numero' || header === 'colegiado' || header === 'nº') entry.numeroColegiado = val;
        });

        if (entry.nombre) {
          newEntities.push(entry);
        }
      }

      if (newEntities.length > 0) {
        onUpdate([...data, ...newEntities]);
        alert(`Se han importado ${newEntities.length} registros con éxito.`);
      } else {
        alert("No se encontraron registros válidos para importar. Asegúrese de que el CSV tenga una columna 'nombre'.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getIcon = () => {
    switch(type) {
      case 'juzgado': return <LandmarkIcon size={24} />;
      case 'tipo_expediente': return <TagIcon size={24} />;
      case 'tipo_procedimiento': return <LayersIcon size={24} />;
      case 'cliente': return <UsersIcon size={24} />;
      case 'contrario': return <UsersIcon size={24} />;
      case 'abogado': return <BriefcaseIcon size={24} />;
      case 'procurador': return <GavelIcon size={24} />;
      default: return <TagIcon size={24} />;
    }
  };

  const isSimpleType = type === 'tipo_expediente' || type === 'tipo_procedimiento';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           {onBackToCases && (
             <button 
               onClick={onBackToCases}
               className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
               title="Regresar a Expedientes"
             >
               <ArrowLeftIcon size={20} />
             </button>
           )}
           <div>
             <h2 className="text-2xl font-bold text-slate-900 capitalize">Gestión de {type.replace('_', ' ')}s</h2>
             <p className="text-slate-500 text-sm">Administra la base de datos de {type.replace('_', ' ')}s del despacho.</p>
           </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={`Buscar...`}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Export buttons */}
            {!isSimpleType && (
              <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                 <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-200"
                    title="Exportar filtrados a CSV"
                 >
                   <DownloadIcon size={16} />
                   <span className="text-xs font-bold">CSV</span>
                 </button>
                 <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Exportar filtrados a PDF"
                 >
                   <FileTextIcon size={16} />
                   <span className="text-xs font-bold">PDF</span>
                 </button>
              </div>
            )}

            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"
              title="Importar registros desde CSV"
            >
              <UploadIcon size={18} />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-md"
            >
              <PlusIcon size={18} />
              <span>Añadir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(entity => (
          <div key={entity.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden">
            {editingId === entity.id ? (
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={editFormData?.nombre} 
                  onChange={e => setEditFormData({...editFormData!, nombre: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50"
                  placeholder="Nombre completo o Razón Social"
                />
                {!isSimpleType && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                       <input 
                        type="text" 
                        value={editFormData?.documento} 
                        onChange={e => setEditFormData({...editFormData!, documento: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        placeholder={type === 'juzgado' ? 'Código/ID' : 'DNI/NIF/CIF'}
                      />
                      <input 
                        type="text" 
                        value={editFormData?.telefono || ''} 
                        onChange={e => setEditFormData({...editFormData!, telefono: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Teléfono"
                      />
                    </div>
                    <input 
                      type="email" 
                      value={editFormData?.email || ''} 
                      onChange={e => setEditFormData({...editFormData!, email: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Correo electrónico"
                    />
                    <input 
                      type="text" 
                      value={editFormData?.direccion || ''} 
                      onChange={e => setEditFormData({...editFormData!, direccion: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Dirección postal"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        value={editFormData?.codigoPostal || ''} 
                        onChange={e => setEditFormData({...editFormData!, codigoPostal: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="C. Postal"
                      />
                      <input 
                        type="text" 
                        value={editFormData?.localidad || ''} 
                        onChange={e => setEditFormData({...editFormData!, localidad: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Localidad"
                      />
                    </div>
                    <input 
                      type="text" 
                      value={editFormData?.provincia || ''} 
                      onChange={e => setEditFormData({...editFormData!, provincia: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Provincia"
                    />
                    {(type === 'abogado' || type === 'procurador') && (
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          value={(editFormData as any).colegio || ''} 
                          onChange={e => setEditFormData({...editFormData!, colegio: e.target.value} as any)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Colegio Profesional"
                        />
                        <input 
                          type="text" 
                          value={(editFormData as any).numeroColegiado || ''} 
                          onChange={e => setEditFormData({...editFormData!, numeroColegiado: e.target.value} as any)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Nº Colegiado"
                        />
                      </div>
                    )}
                    <textarea 
                       value={editFormData?.observaciones} 
                       onChange={e => setEditFormData({...editFormData!, observaciones: e.target.value})}
                       className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                       placeholder="Observaciones adicionales..."
                       rows={2}
                    />
                  </>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                     {getIcon()}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setEditingId(entity.id); setEditFormData(entity); }} className="p-2 text-slate-400 hover:text-amber-600 transition-colors"><Edit2Icon size={18}/></button>
                     <button onClick={() => handleDelete(entity.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2Icon size={18}/></button>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{entity.nombre}</h3>
                
                {!isSimpleType && (
                  <div className="space-y-2 mt-3">
                    <p className="text-slate-500 text-xs font-mono mb-2 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">
                      {entity.documento || 'S/D'}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-1.5">
                      {entity.telefono && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <PhoneIcon size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{entity.telefono}</span>
                        </div>
                      )}
                      {entity.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <MailIcon size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{entity.email}</span>
                        </div>
                      )}
                      {(entity.direccion || entity.localidad) && (
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <MapPinIcon size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            {entity.direccion && <span className="line-clamp-1">{entity.direccion}</span>}
                            {(entity.codigoPostal || entity.localidad || entity.provincia) && (
                              <span className="text-slate-500">
                                {entity.codigoPostal && `${entity.codigoPostal} `}
                                {entity.localidad}
                                {entity.provincia && ` (${entity.provincia})`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {(type === 'abogado' || type === 'procurador') && (entity as any).numeroColegiado && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 italic">
                          <BriefcaseIcon size={14} className="text-slate-400 shrink-0" />
                          <span>Col. {(entity as any).numeroColegiado} {(entity as any).colegio && `- ${(entity as any).colegio}`}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-50">
                      <div className="flex items-start gap-2">
                        <InfoIcon size={14} className="text-slate-300 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">
                          {entity.observaciones || 'Sin observaciones registradas.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
             No hay registros que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityManagement;
