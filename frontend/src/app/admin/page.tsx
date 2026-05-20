'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  RefreshCw, 
  Check, 
  UserMinus, 
  Phone, 
  IdCard, 
  Mail, 
  Calendar 
} from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function AdminPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Estado para rol en modificación (para mostrar un spinner en el botón específico)
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [successUid, setSuccessUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setFetching(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de usuarios. Error de servidor.');
      }

      const data = await response.json();
      setUsersList(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al cargar los usuarios.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    // Si no está cargando y no es admin, no hacemos el fetch
    if (!loading) {
      if (!user || profile?.rol !== 'administrador') {
        // Redirección se maneja en el render para mostrar acceso denegado
        return;
      }
      fetchUsers();
    }
  }, [user, profile, token, loading]);

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    setUpdatingUid(targetUid);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/users/${targetUid}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rol: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo actualizar el rol del usuario.');
      }

      // Actualizar lista local
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, rol: newRole as any } : u));
      
      // Mostrar feedback de éxito
      setSuccessUid(targetUid);
      setTimeout(() => setSuccessUid(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el rol.');
    } finally {
      setUpdatingUid(null);
    }
  };

  // Render para estado de carga general de Auth
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // Render para Acceso Denegado si el usuario no es Administrador
  if (!user || profile?.rol !== 'administrador') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-950 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.08),rgba(255,255,255,0))]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-md w-full text-center p-8 backdrop-blur-xl bg-slate-900/40 border border-red-500/20 rounded-3xl shadow-2xl"
        >
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl text-red-500 mb-5">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm mb-6">
            Lo sentimos, este panel de administración es exclusivo para usuarios con el rol de <strong>administrador</strong>.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all cursor-pointer"
          >
            Volver al Catálogo
          </button>
        </motion.div>
      </div>
    );
  }

  // Filtrar lista de usuarios
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cedula.includes(searchTerm);
      
    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Estadísticas rápidas
  const totalUsersCount = usersList.length;
  const adminCount = usersList.filter(u => u.rol === 'administrador').length;
  const colaboradorCount = usersList.filter(u => u.rol === 'colaborador').length;
  const clienteCount = usersList.filter(u => u.rol === 'cliente').length;

  return (
    <div className="relative min-h-[90vh] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
              Panel de Control
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Administración de usuarios, asignación de roles y estados de cuenta.
            </p>
          </div>
          <button 
            onClick={fetchUsers}
            disabled={fetching}
            className="self-start sm:self-center flex items-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 rounded-xl text-slate-300 text-sm font-medium transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Error alert inside dashboard */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Usuarios</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalUsersCount}</div>
          </div>

          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Administradores</span>
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">{adminCount}</div>
          </div>

          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Colaboradores</span>
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">{colaboradorCount}</div>
          </div>

          <div className="backdrop-blur-md bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Clientes</span>
              <UserMinus className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{clienteCount}</div>
          </div>
        </div>

        {/* Users Table section */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Filters Bar */}
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-5 h-5" />
              </span>
              <input 
                type="text"
                placeholder="Buscar por nombre, correo o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 text-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
              <span className="text-slate-400 text-sm font-medium">Filtrar Rol:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm font-medium outline-none focus:border-cyan-500/40 cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="administrador">Administradores</option>
                <option value="colaborador">Colaboradores</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>
          </div>

          {/* List/Table */}
          {fetching ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Cargando listado de usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-lg font-medium">No se encontraron usuarios</p>
              <p className="text-sm text-slate-600">Intenta modificando los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Usuario / Correo</th>
                    <th className="py-4 px-6">Identidad (Cédula)</th>
                    <th className="py-4 px-6">Contacto (Teléfono)</th>
                    <th className="py-4 px-6">Edad / F. Nac.</th>
                    <th className="py-4 px-6">Rol de Usuario</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-800/20 transition-colors">
                      
                      {/* Name / Email */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-semibold text-white">{u.nombre}</p>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {u.email}
                          </span>
                        </div>
                      </td>

                      {/* Cedula */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-300 font-mono flex items-center gap-1.5">
                          <IdCard className="w-4 h-4 text-slate-500" />
                          {u.cedula || '---'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-500" />
                          {u.telefono || '---'}
                        </span>
                      </td>

                      {/* Age & Birthday */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm text-slate-300">{u.edad ? `${u.edad} años` : '---'}</p>
                          {u.fecha_nacimiento && (
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {u.fecha_nacimiento}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          
                          {/* Success Indicator */}
                          {successUid === u.uid && (
                            <span className="text-xs text-emerald-400 flex items-center gap-1 animate-pulse">
                              <Check className="w-4 h-4" />
                              Guardado
                            </span>
                          )}

                          <select
                            disabled={updatingUid === u.uid}
                            value={u.rol}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                            className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold outline-none focus:border-cyan-500/40 cursor-pointer disabled:opacity-50"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="colaborador">Colaborador</option>
                            <option value="administrador">Administrador</option>
                          </select>

                          {updatingUid === u.uid && (
                            <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shrink-0" />
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

      </div>
    </div>
  );
}
