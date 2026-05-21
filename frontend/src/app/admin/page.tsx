'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Search, 
  RefreshCw, 
  Check, 
  UserMinus, 
  Phone, 
  IdCard, 
  Mail, 
  Calendar,
  FileText,
  DollarSign,
  Clock,
  Weight,
  Settings,
  AlertCircle,
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function AdminPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  // Gestión de pestañas (Tabs)
  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'usuarios'>('cotizaciones');

  // Estado para gestión de Usuarios
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersFetching, setUsersFetching] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('todos');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [successUid, setSuccessUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado para gestión de Cotizaciones
  const [quotesList, setQuotesList] = useState<any[]>([]);
  const [quotesFetching, setQuotesFetching] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('todos');

  // Variables globales de cálculo de cotización
  const [precioKwhHora, setPrecioKwhHora] = useState<number>(950);
  const [precioFilamentoKg, setPrecioFilamentoKg] = useState<number>(87000);
  
  // Valores editables de cálculo por producto (index -> valores)
  const [calcValues, setCalcValues] = useState<{[key: number]: {
    duracion: string;
    filamento: string;
    valorEmpaque: string;
    valorPersonalizacion: string;
    ganancia: string;
  }}>({});

  // Cargar lista de usuarios desde API (solo si es Administrador)
  const fetchUsers = async () => {
    if (!token || profile?.rol !== 'administrador') return;
    setUsersFetching(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de usuarios.');
      }
      const data = await response.json();
      setUsersList(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar usuarios.');
    } finally {
      setUsersFetching(false);
    }
  };

  // Cargar cotizaciones desde Firestore en tiempo real (para Admin y Colaborador)
  useEffect(() => {
    if (!user || (profile?.rol !== 'administrador' && profile?.rol !== 'colaborador')) return;

    const q = query(collection(db, 'quotes'), orderBy('creadoEn', 'desc'));
    setQuotesFetching(true);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotesList(quotesData);
      setQuotesFetching(false);
    }, (err) => {
      console.error('Error fetching quotes:', err);
      setQuotesFetching(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  // Cargar usuarios cuando se selecciona la pestaña de usuarios
  useEffect(() => {
    if (activeTab === 'usuarios' && profile?.rol === 'administrador') {
      fetchUsers();
    }
  }, [activeTab, profile, token]);

  // Cargar valores por defecto o guardados al seleccionar una cotización
  useEffect(() => {
    if (!selectedQuote) return;
    
    const initialCalcs: any = {};
    selectedQuote.productos.forEach((p: any, idx: number) => {
      initialCalcs[idx] = {
        duracion: p.duracionImpresionUnidad?.toString() || '0',
        filamento: p.filamentoUsadoUnidad?.toString() || '0',
        valorEmpaque: p.valorEmpaqueUnitario?.toString() || '0',
        valorPersonalizacion: p.valorPersonalizacionUnitario?.toString() || '0',
        ganancia: p.porcentajeGanancia?.toString() || selectedQuote.porcentajeGanancia?.toString() || '30'
      };
    });
    setCalcValues(initialCalcs);
  }, [selectedQuote]);

  // Manejar cambio de pestaña
  const handleTabChange = (tab: 'cotizaciones' | 'usuarios') => {
    setActiveTab(tab);
    setError(null);
  };

  // Guardar cambio de rol de usuario (solo Admin)
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
        throw new Error('No se pudo actualizar el rol del usuario.');
      }

      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, rol: newRole as any } : u));
      setSuccessUid(targetUid);
      setTimeout(() => setSuccessUid(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el rol.');
    } finally {
      setUpdatingUid(null);
    }
  };

  // Realizar cálculos matemáticos dinámicos por producto
  const getProductCalculations = (idx: number, unidades: number) => {
    const vals = calcValues[idx] || {
      duracion: '0',
      filamento: '0',
      valorEmpaque: '0',
      valorPersonalizacion: '0',
      ganancia: '30'
    };

    const duracion = parseFloat(vals.duracion) || 0;
    const filamento = parseFloat(vals.filamento) || 0;
    const valorEmpaque = parseFloat(vals.valorEmpaque) || 0;
    const valorPersonalizacion = parseFloat(vals.valorPersonalizacion) || 0;
    const ganancia = parseFloat(vals.ganancia) || 0;

    // Fórmulas
    const precioKwhMinuto = precioKwhHora / 60; // 950 / 60 = 15.83 COP/min
    const costoEnergiaUnitario = duracion * precioKwhMinuto;
    
    const costoFilamentoGramo = precioFilamentoKg / 1000; // 87000 / 1000 = 87 COP/g
    const costoFilamentoUnitario = filamento * costoFilamentoGramo;

    const costoFabricacionUnitario = costoEnergiaUnitario + costoFilamentoUnitario;
    const precioFabricacionUnitarioConGanancia = costoFabricacionUnitario * (1 + ganancia / 100);

    const subtotalFabricacionTotal = precioFabricacionUnitarioConGanancia * unidades;
    const valorGananciaTotal = (precioFabricacionUnitarioConGanancia - costoFabricacionUnitario) * unidades;

    const precioTotal = (precioFabricacionUnitarioConGanancia + valorEmpaque + valorPersonalizacion) * unidades;

    return {
      costoEnergiaUnitario,
      costoFilamentoUnitario,
      costoFabricacionUnitario,
      precioFabricacionUnitarioConGanancia,
      subtotalFabricacionTotal,
      valorGananciaTotal,
      precioTotal,
      duracion,
      filamento,
      valorEmpaque,
      valorPersonalizacion,
      ganancia
    };
  };

  // Calcular totales generales de la cotización seleccionada
  const getQuoteTotals = () => {
    if (!selectedQuote) return { subtotalFabricacion: 0, ganancia: 0, total: 0 };
    
    let subtotalFabricacion = 0;
    let ganancia = 0;
    let total = 0;

    selectedQuote.productos.forEach((p: any, idx: number) => {
      const calcs = getProductCalculations(idx, p.unidades);
      subtotalFabricacion += calcs.subtotalFabricacionTotal;
      ganancia += calcs.valorGananciaTotal;
      total += calcs.precioTotal;
    });

    return { subtotalFabricacion, ganancia, total };
  };

  // Manejar cambio de inputs de cálculo por producto
  const handleCalcInputChange = (idx: number, field: string, value: string) => {
    setCalcValues(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        [field]: value
      }
    }));
  };

  // Guardar cálculo de cotización en Firestore
  const handleSaveQuote = async (newStatus: string) => {
    if (!selectedQuote) return;
    setUpdatingUid(selectedQuote.id); // Reusar spinner de carga para feedback
    try {
      const updatedProductos = selectedQuote.productos.map((p: any, idx: number) => {
        const calcs = getProductCalculations(idx, p.unidades);
        return {
          ...p,
          duracionImpresionUnidad: calcs.duracion,
          filamentoUsadoUnidad: calcs.filamento,
          valorEmpaqueUnitario: calcs.valorEmpaque,
          valorPersonalizacionUnitario: calcs.valorPersonalizacion,
          porcentajeGanancia: calcs.ganancia,
          precioFabricacionUnitarioConGanancia: Math.round(calcs.precioFabricacionUnitarioConGanancia * 100) / 100,
          precioTotal: Math.round(calcs.precioTotal * 100) / 100,
          subtotalFabricacionTotal: Math.round(calcs.subtotalFabricacionTotal * 100) / 100,
          valorGananciaTotal: Math.round(calcs.valorGananciaTotal * 100) / 100
        };
      });

      const { subtotalFabricacion, ganancia, total } = getQuoteTotals();
      
      const quoteRef = doc(db, 'quotes', selectedQuote.id);
      await updateDoc(quoteRef, {
        productos: updatedProductos,
        estado: newStatus,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        actualizadoEn: new Date().toISOString()
      });

      // Actualizar elemento seleccionado local
      setSelectedQuote((prev: any) => ({
        ...prev,
        productos: updatedProductos,
        estado: newStatus,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100
      }));

      alert('Cotización guardada exitosamente con estado: ' + newStatus);
    } catch (err: any) {
      console.error('Error al guardar cotización:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setUpdatingUid(null);
    }
  };

  // Acceso denegado
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

  if (!user || (profile?.rol !== 'administrador' && profile?.rol !== 'colaborador')) {
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
            Lo sentimos, este panel de administración es exclusivo para usuarios con el rol de <strong>administrador</strong> o <strong>colaborador</strong>.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all cursor-pointer"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  // Filtrado de usuarios
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.nombre?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.cedula?.includes(userSearchTerm);
    const matchesRole = userRoleFilter === 'todos' || u.rol === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtrado de cotizaciones
  const filteredQuotes = quotesList.filter(q => {
    const matchesSearch = 
      q.cliente?.nombre?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || 
      q.cliente?.email?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
      q.id?.toLowerCase().includes(quoteSearchTerm.toLowerCase());
    const matchesStatus = quoteStatusFilter === 'todos' || q.estado === quoteStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Contadores
  const quotesCount = quotesList.length;
  const quotesPendingCount = quotesList.filter(q => q.estado === 'pendiente').length;
  const quotesCalculatedCount = quotesList.filter(q => q.estado === 'cotizado').length;
  const quotesAcceptedCount = quotesList.filter(q => q.estado === 'aceptado').length;

  return (
    <div className="relative min-h-[90vh] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.07),transparent)] -z-10" />

      <div className="relative max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-outfit">
              <ShieldAlert className="w-8 h-8 text-cyan-400" />
              Panel de Administración
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gestiona cotizaciones, calcula costos en tiempo real y administra usuarios del sistema.
            </p>
          </div>
          
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize bg-slate-900 border border-slate-800 text-cyan-400">
              Rol: {profile?.rol}
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS (TABS) */}
        <div className="flex border-b border-slate-850">
          <button 
            onClick={() => handleTabChange('cotizaciones')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cotizaciones' 
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cotizaciones Pendientes y Activas
          </button>
          
          {profile?.rol === 'administrador' && (
            <button 
              onClick={() => handleTabChange('usuarios')}
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'usuarios' 
                  ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Control de Usuarios y Roles
            </button>
          )}
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        <AnimatePresence mode="wait">
          {activeTab === 'cotizaciones' ? (
            <motion.div
              key="cotizaciones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              
              {/* Tarjetas de estadísticas de cotizaciones */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Total Solicitudes</div>
                  <div className="text-3xl font-extrabold text-white">{quotesCount}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="text-xs uppercase font-semibold text-amber-400 tracking-wider mb-1">Pendientes de Costos</div>
                  <div className="text-3xl font-extrabold text-amber-400">{quotesPendingCount}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="text-xs uppercase font-semibold text-cyan-400 tracking-wider mb-1">Cotizadas / Enviadas</div>
                  <div className="text-3xl font-extrabold text-cyan-400">{quotesCalculatedCount}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="text-xs uppercase font-semibold text-emerald-400 tracking-wider mb-1">Pedidos Aceptados</div>
                  <div className="text-3xl font-extrabold text-emerald-400">{quotesAcceptedCount}</div>
                </div>
              </div>

              {/* Vista principal del cotizador (Dos Columnas) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Columna Izquierda: Listado de cotizaciones */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-4">
                  <h2 className="text-lg font-bold text-white px-2">Búsqueda y Filtros</h2>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                        <Search className="w-4 h-4" />
                      </span>
                      <input 
                        type="text"
                        placeholder="Buscar por cliente o ID..."
                        value={quoteSearchTerm}
                        onChange={(e) => setQuoteSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-650 outline-none focus:border-cyan-500/40 text-xs transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs text-slate-400 font-medium">Estado:</span>
                      <select
                        value={quoteStatusFilter}
                        onChange={(e) => setQuoteStatusFilter(e.target.value)}
                        className="flex-1 py-1.5 px-3 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs font-medium cursor-pointer focus:outline-none"
                      >
                        <option value="todos">Todos</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="cotizado">Cotizadas</option>
                        <option value="aceptado">Aceptadas</option>
                        <option value="rechazado">Rechazadas</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 max-h-[500px] overflow-y-auto space-y-2 pr-1">
                    {quotesFetching ? (
                      <div className="py-12 text-center text-slate-500 text-xs">Cargando cotizaciones...</div>
                    ) : filteredQuotes.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs">No se encontraron cotizaciones</div>
                    ) : (
                      filteredQuotes.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuote(q)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                            selectedQuote?.id === q.id
                              ? 'bg-slate-800/40 border-cyan-500/60 shadow-md shadow-cyan-500/5'
                              : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-mono text-cyan-400 font-bold max-w-[130px] truncate">{q.id}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              q.estado === 'pendiente'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : q.estado === 'cotizado'
                                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                : q.estado === 'aceptado'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {q.estado}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-white truncate">{q.cliente?.nombre || 'Cliente sin nombre'}</p>
                            <span className="text-[10px] text-slate-400">{q.productos?.length || 0} {q.productos?.length === 1 ? 'producto' : 'productos'}</span>
                          </div>

                          {q.precioTotalCotizacion > 0 && (
                            <div className="text-xs font-bold text-emerald-400 mt-0.5">
                              Total: ${q.precioTotalCotizacion.toLocaleString('es-CO')} COP
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Detalle de Cotización y Calculadora */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedQuote ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl space-y-8">
                      
                      {/* Cabecera del detalle */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-slate-800 pb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Detalles de Cotización</span>
                            <span className="text-xs font-mono text-cyan-400 font-bold select-all bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{selectedQuote.id}</span>
                          </div>
                          <h2 className="text-2xl font-extrabold text-white">{selectedQuote.cliente?.nombre}</h2>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2">
                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedQuote.cliente?.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedQuote.cliente?.telefono}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Estado actual</span>
                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                            selectedQuote.estado === 'pendiente'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : selectedQuote.estado === 'cotizado'
                              ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                              : selectedQuote.estado === 'aceptado'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {selectedQuote.estado}
                          </span>
                        </div>
                      </div>

                      {/* AJUSTES DE COSTOS DE FABRICACIÓN GENERALES */}
                      <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-cyan-400" />
                          Configuración de Variables de Fabricación (Moneda local COP)
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Precio de Energía por Kilovatio Hora (Kwh/H)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">$</span>
                              <input 
                                type="number"
                                value={precioKwhHora}
                                onChange={(e) => {
                                  setPrecioKwhHora(parseFloat(e.target.value) || 0);
                                }}
                                className="w-full pl-7 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500/40"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              Calculado a ${(precioKwhHora / 60).toFixed(2)} COP por minuto de impresión.
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Precio del Filamento por Kilogramo (Kg)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">$</span>
                              <input 
                                type="number"
                                value={precioFilamentoKg}
                                onChange={(e) => {
                                  setPrecioFilamentoKg(parseFloat(e.target.value) || 0);
                                }}
                                className="w-full pl-7 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500/40"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              Equivale a ${(precioFilamentoKg / 1000).toFixed(2)} COP por gramo de plástico utilizado.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* DETALLE Y CALCULADORA POR CADA PRODUCTO */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Cálculo de Costos por Producto</h3>
                        
                        {selectedQuote.productos.map((producto: any, idx: number) => {
                          const calcs = getProductCalculations(idx, producto.unidades);
                          const currentVals = calcValues[idx] || {
                            duracion: '0',
                            filamento: '0',
                            valorEmpaque: '0',
                            valorPersonalizacion: '0',
                            ganancia: '30'
                          };

                          return (
                            <div key={idx} className="border border-slate-800/80 rounded-2xl overflow-hidden shadow-md">
                              {/* Encabezado del Producto */}
                              <div className="bg-slate-950/60 p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{producto.nombre}</h4>
                                  <span className="text-xs text-slate-400">
                                    Dimensiones: {producto.tamanoHorizontal}x{producto.tamanoVertical} mm | Cantidad: {producto.unidades} unidad(es)
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-cyan-400 px-3 py-1 bg-cyan-950/20 border border-cyan-800/20 rounded-lg">
                                  Producto #{idx + 1}
                                </span>
                              </div>

                              {/* Detalles de requerimientos y Foto */}
                              <div className="p-5 bg-slate-900/10 grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-slate-850">
                                
                                <div className="md:col-span-8 space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Accesorios</span>
                                      <p className="text-xs text-slate-300 mt-1">{producto.accesorios || 'Ninguno especificado'}</p>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Personalización</span>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {producto.personalizacion?.length > 0 ? (
                                          producto.personalizacion.map((p: string, pIdx: number) => (
                                            <span key={pIdx} className="text-[10px] bg-slate-850 text-slate-300 px-2 py-0.5 rounded border border-slate-800 capitalize">
                                              {p === 'otra' ? `Otra: ${producto.personalizacionOtraText || ''}` : p}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-slate-400">Sin personalización</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Empaque</span>
                                    <p className="text-xs text-slate-300 mt-1 capitalize">
                                      {producto.empaque === 'otra' ? `Otro: ${producto.empaqueOtraText || ''}` : producto.empaque}
                                    </p>
                                  </div>
                                </div>

                                <div className="md:col-span-4 flex flex-col items-center justify-center border-l border-slate-850/80 pl-2">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Foto Referencial</span>
                                  {producto.imagenUrl ? (
                                    <a href={producto.imagenUrl} target="_blank" rel="noopener noreferrer" className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800 hover:border-cyan-500/40 bg-slate-950 flex items-center justify-center transition-all">
                                      <img src={producto.imagenUrl} alt="Producto" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                        <Eye className="w-4 h-4 mr-1" /> Ampliar
                                      </div>
                                    </a>
                                  ) : (
                                    <div className="w-24 h-24 rounded-lg border border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
                                      <ImageIcon className="w-6 h-6 mb-1 text-slate-700" />
                                      <span className="text-[9px]">Sin foto</span>
                                    </div>
                                  )}
                                </div>

                              </div>

                              {/* Formulario Calculadora */}
                              <div className="p-5 bg-slate-950/30 space-y-4">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                                  <DollarSign className="w-4 h-4 text-cyan-400" />
                                  Simulador y Asignación de Costos
                                </span>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  
                                  {/* Duración */}
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Duración (min)</label>
                                    <div className="relative">
                                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                                        <Clock className="w-3.5 h-3.5" />
                                      </span>
                                      <input 
                                        type="number"
                                        min="0"
                                        value={currentVals.duracion}
                                        onChange={(e) => handleCalcInputChange(idx, 'duracion', e.target.value)}
                                        className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Peso Filamento */}
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Filamento (g)</label>
                                    <div className="relative">
                                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                                        <Weight className="w-3.5 h-3.5" />
                                      </span>
                                      <input 
                                        type="number"
                                        min="0"
                                        value={currentVals.filamento}
                                        onChange={(e) => handleCalcInputChange(idx, 'filamento', e.target.value)}
                                        className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Margen de Ganancia */}
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ganancia (%)</label>
                                    <div className="relative">
                                      <input 
                                        type="number"
                                        value={currentVals.ganancia}
                                        onChange={(e) => handleCalcInputChange(idx, 'ganancia', e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none text-right"
                                      />
                                    </div>
                                  </div>

                                  {/* Valor Personalización */}
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Valor Personaliz. ($)</label>
                                    <div className="relative">
                                      <input 
                                        type="number"
                                        value={currentVals.valorPersonalizacion}
                                        onChange={(e) => handleCalcInputChange(idx, 'valorPersonalizacion', e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none text-right"
                                      />
                                    </div>
                                  </div>

                                  {/* Valor Empaque */}
                                  <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Valor Empaque ($)</label>
                                    <div className="relative">
                                      <input 
                                        type="number"
                                        value={currentVals.valorEmpaque}
                                        onChange={(e) => handleCalcInputChange(idx, 'valorEmpaque', e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none text-right"
                                      />
                                    </div>
                                  </div>

                                </div>

                                {/* Resultados Desglosados */}
                                <div className="bg-slate-950 border border-slate-850/80 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Costo Fabricación Base (Unit.):</span>
                                    <span className="font-semibold text-slate-300">
                                      ${Math.round(calcs.costoFabricacionUnitario).toLocaleString('es-CO')} COP
                                    </span>
                                    <span className="block text-[9px] text-slate-500 mt-0.5">
                                      (E: ${Math.round(calcs.costoEnergiaUnitario)} | F: ${Math.round(calcs.costoFilamentoUnitario)})
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Precio Fabr. con Ganancia (Unit.):</span>
                                    <span className="font-bold text-cyan-400">
                                      ${Math.round(calcs.precioFabricacionUnitarioConGanancia).toLocaleString('es-CO')} COP
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Subtotal Fabr. Total:</span>
                                    <span className="font-semibold text-slate-200">
                                      ${Math.round(calcs.subtotalFabricacionTotal).toLocaleString('es-CO')} COP
                                    </span>
                                    <span className="block text-[9px] text-slate-500 mt-0.5">
                                      Ganancia total: ${Math.round(calcs.valorGananciaTotal).toLocaleString('es-CO')} COP
                                    </span>
                                  </div>

                                  <div className="border-l border-slate-800/80 pl-4">
                                    <span className="text-[10px] text-slate-500 block">Precio Total Producto:</span>
                                    <span className="font-extrabold text-emerald-400 text-sm">
                                      ${Math.round(calcs.precioTotal).toLocaleString('es-CO')} COP
                                    </span>
                                    <span className="block text-[9px] text-slate-500 mt-0.5">
                                      (Inc. empaque/personaliz.)
                                    </span>
                                  </div>

                                </div>

                              </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* RESUMEN TOTAL DE LA COTIZACIÓN Y ACCIONES */}
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        
                        <div className="space-y-1.5 text-center md:text-left">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Totales de la Cotización Completa</span>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-slate-400">
                            <div>
                              <span>Subtotal Fabricación: </span>
                              <span className="font-semibold text-slate-200">${Math.round(getQuoteTotals().subtotalFabricacion).toLocaleString('es-CO')} COP</span>
                            </div>
                            <div>
                              <span>Ganancia Esperada: </span>
                              <span className="font-semibold text-cyan-400">${Math.round(getQuoteTotals().ganancia).toLocaleString('es-CO')} COP</span>
                            </div>
                          </div>
                          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                            Total: ${Math.round(getQuoteTotals().total).toLocaleString('es-CO')} COP
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 justify-end">
                          <button
                            disabled={updatingUid === selectedQuote.id}
                            onClick={() => handleSaveQuote('cotizado')}
                            className="py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Guardar y Enviar Cotización
                          </button>
                          
                          <div className="flex gap-2">
                            <button
                              disabled={updatingUid === selectedQuote.id}
                              onClick={() => handleSaveQuote('aceptado')}
                              className="flex-1 py-3 px-4 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Marcar como Aceptada"
                            >
                              Aceptada
                            </button>
                            <button
                              disabled={updatingUid === selectedQuote.id}
                              onClick={() => handleSaveQuote('rechazado')}
                              className="flex-1 py-3 px-4 bg-red-900/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Marcar como Rechazada"
                            >
                              Rechazada
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-900/10 border border-slate-850/80 border-dashed rounded-3xl p-20 text-center text-slate-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-slate-800" />
                      <p className="text-lg font-bold text-slate-400">Ninguna Cotización Seleccionada</p>
                      <p className="text-xs text-slate-600 mt-1">Elige una solicitud pendiente de la lista lateral para procesarla.</p>
                    </div>
                  )}
                </div>

              </div>

            </motion.div>
          ) : (
            // PESTAÑA: CONTROL DE USUARIOS (Solo accesible para Administrador)
            <motion.div
              key="usuarios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              
              {/* Filtros Bar */}
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="relative w-full md:max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                    <Search className="w-5 h-5" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-650 outline-none focus:border-cyan-500/40 text-sm transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                  <span className="text-slate-400 text-sm font-medium">Filtrar Rol:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="py-2.5 px-4 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 text-sm font-medium cursor-pointer focus:outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="administrador">Administradores</option>
                    <option value="colaborador">Colaboradores</option>
                    <option value="cliente">Clientes</option>
                  </select>
                </div>
              </div>

              {/* Listado de Usuarios */}
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                {usersFetching ? (
                  <div className="py-20 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Cargando listado de usuarios...</p>
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
                        <tr className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-850">
                          <th className="py-4 px-6">Usuario / Correo</th>
                          <th className="py-4 px-6">Identidad (Cédula)</th>
                          <th className="py-4 px-6">Contacto (Teléfono)</th>
                          <th className="py-4 px-6">Edad / F. Nac.</th>
                          <th className="py-4 px-6">Rol de Usuario</th>
                          <th className="py-4 px-6 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-sm font-semibold text-white">{u.nombre}</p>
                                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  {u.email}
                                </span>
                              </div>
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
                                    <Check className="w-4 h-4" />
                                    Guardado
                                  </span>
                                )}
                                <select
                                  disabled={updatingUid === u.uid}
                                  value={u.rol}
                                  onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                                  className="py-1.5 px-3 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50"
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
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
