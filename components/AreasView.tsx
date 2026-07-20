import React, { useState } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Building, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export const AreasView: React.FC = () => {
    const { organizationAreas, addOrganizationArea, updateOrganizationArea, deleteOrganizationArea, addNotification } = useSisreq();
    const [newArea, setNewArea] = useState('');
    const [editingArea, setEditingArea] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newArea.trim()) {
            try {
                await addOrganizationArea(newArea.trim());
                setNewArea('');
            } catch (err: any) {
                addNotification('WARNING', 'Error', err.message || 'No se pudo crear el área. Verifique que no exista previamente.');
            }
        }
    };

    const handleSaveEdit = async () => {
        if (editingArea && editValue.trim() && editingArea !== editValue.trim()) {
            try {
                await updateOrganizationArea(editingArea, editValue.trim());
            } catch (err: any) {
                addNotification('WARNING', 'Error', err.message || 'No se pudo actualizar el área.');
            }
        }
        setEditingArea(null);
        setEditValue('');
    };

    const [areaToDelete, setAreaToDelete] = useState<string | null>(null);

    const handleDelete = (area: string) => {
        setAreaToDelete(area);
    };

    const confirmDelete = async () => {
        if (areaToDelete) {
            try {
                await deleteOrganizationArea(areaToDelete);
            } catch (err: any) {
                addNotification('WARNING', 'Error', err.message || 'No se pudo eliminar el área.');
            }
            setAreaToDelete(null);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto w-full h-full flex flex-col gap-8 overflow-y-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                    <Building className="text-indigo-600" />
                    Unidades de la Organización
                </h1>
                <p className="text-slate-500 font-medium text-sm">
                    Gestione las áreas o unidades funcionales de la empresa.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <form onSubmit={handleAdd} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Nueva Área
                            </label>
                            <input 
                                type="text"
                                value={newArea}
                                onChange={(e) => setNewArea(e.target.value)}
                                placeholder="Nombre de la unidad o departamento..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-sm"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!newArea.trim()}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus size={16} /> Agregar
                        </button>
                    </form>
                </div>

                <div className="divide-y divide-slate-100">
                    {organizationAreas.map(area => (
                        <div key={area} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                            {editingArea === area ? (
                                <div className="flex items-center gap-4 flex-1 mr-8">
                                    <input 
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-white border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSaveEdit}
                                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                            <Save size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setEditingArea(null)}
                                            className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                            <Building size={20} />
                                        </div>
                                        <span className="font-bold text-slate-700 text-lg">{area}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                setEditingArea(area);
                                                setEditValue(area);
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Editar Área"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(area)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Área"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {organizationAreas.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-medium">
                            No hay áreas registradas en la organización.
                        </div>
                    )}
                </div>
            </div>

            {areaToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 text-red-600 mb-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Confirmar Eliminación</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6">
                            ¿Está seguro que desea eliminar el área <strong className="text-slate-900">{areaToDelete}</strong>? Esta acción no se puede deshacer y los registros históricos podrían verse afectados.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setAreaToDelete(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
                            >
                                Sí, Eliminar Área
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
