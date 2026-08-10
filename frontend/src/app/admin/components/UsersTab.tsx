'use client';

import { Search, RefreshCw, Users, Mail, IdCard, Phone, Calendar, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/context/AuthContext';

interface UsersTabProps {
  filteredUsers: UserProfile[];
  usersFetching: boolean;
  error: string | null;
  fetchUsers: () => void;
  userSearchTerm: string;
  setUserSearchTerm: (v: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (v: string) => void;
  successUid: string | null;
  updatingUid: string | null;
  handleRoleChange: (targetUid: string, newRole: string) => void;
}

export default function UsersTab({
  filteredUsers,
  usersFetching,
  error,
  fetchUsers,
  userSearchTerm,
  setUserSearchTerm,
  userRoleFilter,
  setUserRoleFilter,
  successUid,
  updatingUid,
  handleRoleChange,
}: UsersTabProps) {
  return (
            <motion.div
              key="usuarios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/40 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <span className="text-slate-400 text-sm font-medium">filtrar rol:</span>
                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                    className="py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm cursor-pointer focus:outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="administrador">Administradores</option>
                    <option value="colaborador">Colaboradores</option>
                    <option value="cliente">Clientes</option>
                  </select>
                  <button
                    onClick={fetchUsers}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Recargar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                {usersFetching ? (
                  <div className="py-20 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Cargando usuarios...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-20 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p className="text-lg font-medium">No se encontraron usuarios</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                          <th className="py-4 px-6">Usuario / Correo</th>
                          <th className="py-4 px-6">Cédula</th>
                          <th className="py-4 px-6">Teléfono</th>
                          <th className="py-4 px-6">Edad</th>
                          <th className="py-4 px-6">Rol</th>
                          <th className="py-4 px-6 text-right">Cambiar Rol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredUsers.map(u => (
                          <tr key={u.uid} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-4 px-6">
                              <p className="text-sm font-semibold text-white">{u.nombre}</p>
                              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-slate-300 font-mono flex items-center gap-1.5">
                                <IdCard className="w-4 h-4 text-slate-500" />
                                {u.cedula || '---'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-slate-300 flex items-center gap-1.5">
                                <Phone className="w-4 h-4 text-slate-500" />
                                {u.telefono || '---'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm text-slate-300">{u.edad ? `${u.edad} años` : '---'}</p>
                              {u.fecha_nacimiento && (
                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" /> {u.fecha_nacimiento}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                                u.rol === 'administrador'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : u.rol === 'colaborador'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                {u.rol}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-2 justify-end">
                                {successUid === u.uid && (
                                  <span className="text-xs text-emerald-400 flex items-center gap-1 animate-pulse">
                                    <Check className="w-4 h-4" /> Guardado
                                  </span>
                                )}
                                <select
                                  disabled={updatingUid === u.uid}
                                  value={u.rol}
                                  onChange={e => handleRoleChange(u.uid, e.target.value)}
                                  className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50"
                                >
                                  <option value="cliente">Cliente</option>
                                  <option value="colaborador">Colaborador</option>
                                  <option value="administrador">Administrador</option>
                                </select>
                                {updatingUid === u.uid && (
                                  <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
  );
}
