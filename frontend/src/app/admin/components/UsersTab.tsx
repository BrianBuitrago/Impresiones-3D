'use client';

import { Search, RefreshCw, Users, Mail, IdCard, Phone, Calendar, Check, ShieldCheck, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/context/AuthContext';

interface UsersTabProps {
  usersList: UserProfile[];
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

const roleBadgeClass = (rol: string) =>
  rol === 'administrador'
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    : rol === 'colaborador'
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    : 'bg-blue-500/10 border-blue-500/20 text-blue-400';

const RoleSelect = ({
  u,
  updatingUid,
  handleRoleChange,
  className,
}: {
  u: UserProfile;
  updatingUid: string | null;
  handleRoleChange: (targetUid: string, newRole: string) => void;
  className?: string;
}) => (
  <select
    disabled={updatingUid === u.uid}
    value={u.rol}
    onChange={e => handleRoleChange(u.uid, e.target.value)}
    className={className || 'py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50'}
  >
    <option value="cliente">Cliente</option>
    <option value="colaborador">Colaborador</option>
    <option value="administrador">Administrador</option>
  </select>
);

export default function UsersTab({
  usersList,
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
  const kpis = [
    { label: 'Total', value: usersList.length, color: 'text-white', icon: Users },
    { label: 'Administradores', value: usersList.filter(u => u.rol === 'administrador').length, color: 'text-amber-400', icon: ShieldCheck },
    { label: 'Colaboradores', value: usersList.filter(u => u.rol === 'colaborador').length, color: 'text-emerald-400', icon: UserCog },
    { label: 'Clientes', value: usersList.filter(u => u.rol === 'cliente').length, color: 'text-blue-400', icon: Users },
  ];

  return (
            <motion.div
              key="usuarios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <kpi.icon className="w-3.5 h-3.5 text-slate-500" />
                      <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">{kpi.label}</div>
                    </div>
                    <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                  </motion.div>
                ))}
              </div>

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
                    aria-label="Recargar usuarios"
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

              {usersFetching ? (
                <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl py-20 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Cargando usuarios...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl py-20 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-lg font-medium">No se encontraron usuarios</p>
                </div>
              ) : (
                <>
                  {/* Tabla (md y superior) */}
                  <div className="hidden md:block backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
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
                          {filteredUsers.map((u, idx) => (
                            <motion.tr
                              key={u.uid}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: Math.min(idx, 10) * 0.03 }}
                              className="hover:bg-slate-800/10 transition-colors"
                            >
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
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${roleBadgeClass(u.rol)}`}>
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
                                  <RoleSelect u={u} updatingUid={updatingUid} handleRoleChange={handleRoleChange} />
                                  {updatingUid === u.uid && (
                                    <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tarjetas (mobile) */}
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map((u, idx) => (
                      <motion.div
                        key={u.uid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx, 10) * 0.03 }}
                        className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.nombre}</p>
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" /> {u.email}
                            </span>
                          </div>
                          <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${roleBadgeClass(u.rol)}`}>
                            {u.rol}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                          <span className="flex items-center gap-1.5"><IdCard className="w-3.5 h-3.5 text-slate-500" /> {u.cedula || '---'}</span>
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {u.telefono || '---'}</span>
                          {u.edad ? <span className="flex items-center gap-1.5 col-span-2"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {u.edad} años{u.fecha_nacimiento ? ` · ${u.fecha_nacimiento}` : ''}</span> : null}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                          <RoleSelect
                            u={u}
                            updatingUid={updatingUid}
                            handleRoleChange={handleRoleChange}
                            className="flex-1 py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50"
                          />
                          {successUid === u.uid && (
                            <span className="text-xs text-emerald-400 flex items-center gap-1 animate-pulse shrink-0">
                              <Check className="w-4 h-4" /> Guardado
                            </span>
                          )}
                          {updatingUid === u.uid && (
                            <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
  );
}
