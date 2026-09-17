'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Patient, RoleType } from '@/lib/types';
import { getPatients, savePatient, deletePatient } from '@/lib/storage';
import { formatDuration } from '@/lib/calculations';
import { Plus, Trash2, Edit3, User, Clock, Check, X, Users } from 'lucide-react';

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Adicionar / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('psicologa');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNew = () => {
    setEditingPatient(null);
    setName('');
    setRole('psicologa');
    setDuration(45);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditingPatient(p);
    setName(p.name);
    setRole(p.default_role);
    setDuration(p.default_duration);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await savePatient({
        id: editingPatient?.id,
        name: name.trim(),
        default_role: role,
        default_duration: duration,
        notes: notes.trim() || undefined,
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar paciente:', err);
      alert('Erro ao salvar paciente.');
    }
  };

  const handleDelete = async (id: string, patientName: string) => {
    if (confirm(`Deseja realmente remover ${patientName} dos pacientes fixos?`)) {
      try {
        await deletePatient(id);
        await loadData();
      } catch (err) {
        console.error('Erro ao deletar:', err);
      }
    }
  };

  return (
    <div className="space-y-4 px-4 pt-2">
      <Header
        title="Pacientes Fixos"
        subtitle="Facilite o preenchimento dos atendimentos"
        rightAction={
          <button
            type="button"
            onClick={openNew}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        }
      />

      {/* Dica amigável */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800">
        💡 <strong>Dica:</strong> Pacientes cadastrados aqui aparecem como atalhos rápidos de 1 toque na hora de registrar uma nova sessão.
      </div>

      {/* Lista de Pacientes */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          Carregando pacientes...
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Nenhum paciente fixo cadastrado
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
            Cadastre os pacientes que você atende com frequência para registrar as sessões com apenas 1 clique.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Paciente</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {patients.map((p) => {
            const isPsych = p.default_role === 'psicologa';
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-200 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {p.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isPsych
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isPsych ? 'Psicóloga' : 'AT'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Duração padrão: {formatDuration(p.default_duration)}
                    </span>
                    {p.notes && (
                      <span className="text-[11px] text-slate-400 truncate">
                        • {p.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Adicionar/Editar Paciente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingPatient ? 'Editar Paciente' : 'Novo Paciente Fixo'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Paciente
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Função Padrão
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('psicologa');
                      setDuration(45);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      role === 'psicologa'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    🧠 Psicóloga
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('at');
                      setDuration(60);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      role === 'at'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    🤝 AT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Duração Usual: <span className="text-indigo-600 font-bold">{formatDuration(duration)}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[45, 60, 90, 135].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-1.5 text-xs rounded-lg font-medium border ${
                        duration === d
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {formatDuration(d)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consultório 3, atendimento escolar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Paciente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
