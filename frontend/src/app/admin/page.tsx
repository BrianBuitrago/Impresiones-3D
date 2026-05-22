'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import {
  ShieldAlert,
  Users,
  Search,
  Check,
  Phone,
  IdCard,
  Mail,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  Weight,
  Settings,
  Eye,
  CheckCircle2,
  ImageIcon,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (value: number) =>
  `$${Math.round(value).toLocaleString('es-CO')} COP`;

const estadoBadgeClass = (estado: string) => {
  switch (estado) {
    case 'pendiente':  return 'bg-amber-500/10  border-amber-500/25  text-amber-400';
    case 'cotizado':   return 'bg-cyan-500/10   border-cyan-500/25   text-cyan-400';
    case 'aceptado':   return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    case 'rechazado':  return 'bg-red-500/10    border-red-500/25    text-red-400';
    default:           return 'bg-slate-800     border-slate-700     text-slate-400';
  }
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CalcEntry {
  duracion: string;        // minutos de impresión por unidad
  filamento: string;       // gramos de filamento por unidad
  valorEmpaque: string;    // COP por unidad
  valorPersonalizacion: string; // COP por unidad
  ganancia: string;        // porcentaje
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'usuarios'>('cotizaciones');

  // Usuarios
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersFetching, setUsersFetching] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('todos');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [successUid, setSuccessUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cotizaciones
  const [quotesList, setQuotesList] = useState<any[]>([]);
  const [quotesFetching, setQuotesFetching] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('pendiente');

  // Variables globales de fabricación (editables en el panel)
  const [precioKwhHora, setPrecioKwhHora] = useState<number>(950);
  const [precioFilamentoKg, setPrecioFilamentoKg] = useState<number>(87000);
  const [showGlobalConfig, setShowGlobalConfig] = useState(false);

  // Cálculos por producto (index → valores)
  const [calcValues, setCalcValues] = useState<{ [key: number]: CalcEntry }>({});

  // Guardando cotización
  const [saving, setSaving] = useState(false);

  // ── Cargar cotizaciones desde Firestore (tiempo real) ─────────────────────

  useEffect(() => {
    if (!user || (profile?.rol !== 'administrador' && profile?.rol !== 'colaborador')) return;
    const q = query(collection(db, 'quotes'), orderBy('creadoEn', 'desc'));
    setQuotesFetching(true);
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuotesList(data);
      setQuotesFetching(false);
    }, () => setQuotesFetching(false));
    return () => unsub();
  }, [user, profile]);

  // ── Cargar usuarios (solo admin) ──────────────────────────────────────────

  const fetchUsers = async () => {
    if (!token || profile?.rol !== 'administrador') return;
    setUsersFetching(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo obtener la lista de usuarios.');
      setUsersList(await res.json());
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios.');
    } finally {
      setUsersFetching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'usuarios' && profile?.rol === 'administrador') fetchUsers();
  }, [activeTab, profile, token]);

  // ── Inicializar calcValues al seleccionar cotización ──────────────────────

  useEffect(() => {
    if (!selectedQuote) return;
    const init: { [k: number]: CalcEntry } = {};
    selectedQuote.productos.forEach((p: any, idx: number) => {
      init[idx] = {
        duracion: p.duracionImpresionUnidad?.toString() || '0',
        filamento: p.filamentoUsadoUnidad?.toString() || '0',
        valorEmpaque: p.valorEmpaqueUnitario?.toString() || '0',
        valorPersonalizacion: p.valorPersonalizacionUnitario?.toString() || '0',
        ganancia: p.porcentajeGanancia?.toString() || '30',
      };
    });
    setCalcValues(init);
  }, [selectedQuote]);

  // ── Cambio de rol ─────────────────────────────────────────────────────────

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    setUpdatingUid(targetUid);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/users/${targetUid}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rol: newRole }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el rol.');
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, rol: newRole as any } : u));
      setSuccessUid(targetUid);
      setTimeout(() => setSuccessUid(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el rol.');
    } finally {
      setUpdatingUid(null);
    }
  };

  // ── Cambio de inputs de cálculo ───────────────────────────────────────────

  const handleCalcChange = (idx: number, field: keyof CalcEntry, value: string) => {
    setCalcValues(prev => ({
      ...prev,
      [idx]: { ...prev[idx], [field]: value },
    }));
  };

  const handleSelectQuote = (quote: Record<string, unknown>) => {
    setSelectedQuote(quote);
    if (typeof quote.precioKwhHora === 'number') {
      setPrecioKwhHora(quote.precioKwhHora);
    }
    if (typeof quote.precioFilamentoKg === 'number') {
      setPrecioFilamentoKg(quote.precioFilamentoKg);
    }
  };

  // ── Cálculos matemáticos por producto ─────────────────────────────────────
  //
  //  precioKwhMinuto   = precioKwhHora / 60
  //  costoEnergia/u    = duracion(min) × precioKwhMinuto
  //  costoFilamento/u  = filamento(g)  × (precioFilamentoKg / 1000)
  //  costoFabricacion/u= costoEnergia  + costoFilamento
  //  precioConGanancia/u = costoFabricacion × (1 + ganancia/100)
  //  precioTotal/u     = precioConGanancia + valorEmpaque + valorPersonalizacion
  //  subtotalFabTotal  = precioConGanancia × unidades  (sin empaque ni personaliz.)
  //  gananciaTotal     = (precioConGanancia - costoFabricacion) × unidades
  //  precioTotal Prod  = precioTotal/u × unidades

  const calcProduct = (idx: number, unidades: number) => {
    const v = calcValues[idx] || { duracion: '0', filamento: '0', valorEmpaque: '0', valorPersonalizacion: '0', ganancia: '30' };

    const duracion          = parseFloat(v.duracion) || 0;
    const filamento         = parseFloat(v.filamento) || 0;
    const valorEmpaque      = parseFloat(v.valorEmpaque) || 0;
    const valorPersonalizacion = parseFloat(v.valorPersonalizacion) || 0;
    const ganancia          = parseFloat(v.ganancia) || 0;

    const precioKwhMinuto           = precioKwhHora / 60;
    const costoEnergiaUnitario      = duracion * precioKwhMinuto;
    const costoFilamentoUnitario    = filamento * (precioFilamentoKg / 1000);
    const costoFabricacionUnitario  = costoEnergiaUnitario + costoFilamentoUnitario;
    const precioUnitario            = costoFabricacionUnitario * (1 + ganancia / 100);
    const precioTotalUnitario       = precioUnitario + valorEmpaque + valorPersonalizacion;

    const subtotalFabricacionTotal  = precioUnitario * unidades;
    const gananciaTotal             = (precioUnitario - costoFabricacionUnitario) * unidades;
    const precioTotalProducto       = precioTotalUnitario * unidades;

    return {
      duracion, filamento, valorEmpaque, valorPersonalizacion, ganancia,
      precioKwhMinuto,
      costoEnergiaUnitario,
      costoFilamentoUnitario,
      costoFabricacionUnitario,
      precioUnitario,
      precioConGananciaUnitario: precioUnitario,
      precioTotalUnitario,
      subtotalFabricacionTotal,
      gananciaTotal,
      precioTotalProducto,
    };
  };

  const getQuoteTotals = () => {
    if (!selectedQuote) return { subtotalFabricacion: 0, ganancia: 0, total: 0 };
    let subtotalFabricacion = 0, ganancia = 0, total = 0;
    selectedQuote.productos.forEach((p: any, idx: number) => {
      const c = calcProduct(idx, p.unidades);
      subtotalFabricacion += c.subtotalFabricacionTotal;
      ganancia            += c.gananciaTotal;
      total               += c.precioTotalProducto;
    });
    return { subtotalFabricacion, ganancia, total };
  };

  // ── Guardar cotización ────────────────────────────────────────────────────

  const handleSaveQuote = async (newStatus: string) => {
    if (!selectedQuote) return;
    setSaving(true);
    try {
      const updatedProductos = selectedQuote.productos.map((p: any, idx: number) => {
        const c = calcProduct(idx, p.unidades);
        return {
          ...p,
          duracionImpresionUnidad: c.duracion,
          filamentoUsadoUnidad: c.filamento,
          valorEmpaqueUnitario: c.valorEmpaque,
          valorPersonalizacionUnitario: c.valorPersonalizacion,
          porcentajeGanancia: c.ganancia,
          precioKwhHora,
          precioKwhMinuto: Math.round(c.precioKwhMinuto * 100) / 100,
          precioFilamentoKg,
          precioFilamentoGramo: Math.round((precioFilamentoKg / 1000) * 100) / 100,
          costoFabricacionUnitario: Math.round(c.costoFabricacionUnitario * 100) / 100,
          precioUnitario: Math.round(c.precioUnitario * 100) / 100,
          precioConGananciaUnitario: Math.round(c.precioConGananciaUnitario * 100) / 100,
          precioTotalUnitario: Math.round(c.precioTotalUnitario * 100) / 100,
          subtotalFabricacionTotal: Math.round(c.subtotalFabricacionTotal * 100) / 100,
          gananciaTotal: Math.round(c.gananciaTotal * 100) / 100,
          precioTotal: Math.round(c.precioTotalProducto * 100) / 100,
          Precio_Unitario: Math.round(c.precioUnitario * 100) / 100,
          Valor_Ganancia_Total: Math.round(c.gananciaTotal * 100) / 100,
          Precio_Total: Math.round(c.precioTotalProducto * 100) / 100,
          Subtotal_Fabricacion_Total: Math.round(c.subtotalFabricacionTotal * 100) / 100,
        };
      });

      const { subtotalFabricacion, ganancia, total } = getQuoteTotals();

      await updateDoc(doc(db, 'quotes', selectedQuote.id), {
        productos: updatedProductos,
        estado: newStatus,
        precioKwhHora,
        precioFilamentoKg,
        subtotalFabricacionTotal: Math.round(subtotalFabricacion * 100) / 100,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        Subtotal_Fabricacion_Total: Math.round(subtotalFabricacion * 100) / 100,
        Valor_Ganancia_Total: Math.round(ganancia * 100) / 100,
        Precio_Total_Cotizacion: Math.round(total * 100) / 100,
        actualizadoEn: new Date().toISOString(),
      });

      setSelectedQuote((prev: any) => ({
        ...prev,
        productos: updatedProductos,
        estado: newStatus,
        precioKwhHora,
        precioFilamentoKg,
        subtotalFabricacionTotal: Math.round(subtotalFabricacion * 100) / 100,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        Subtotal_Fabricacion_Total: Math.round(subtotalFabricacion * 100) / 100,
        Valor_Ganancia_Total: Math.round(ganancia * 100) / 100,
        Precio_Total_Cotizacion: Math.round(total * 100) / 100,
      }));
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  if (!user || (profile?.rol !== 'administrador' && profile?.rol !== 'colaborador')) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-950 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.08),transparent)]" />
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
            Este panel es exclusivo para usuarios con rol de <strong>administrador</strong> o <strong>colaborador</strong>.
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

  // ── Filtros ───────────────────────────────────────────────────────────────

  const filteredUsers = usersList.filter(u => {
    const q = userSearchTerm.toLowerCase();
    return (
      (u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cedula?.includes(q)) &&
      (userRoleFilter === 'todos' || u.rol === userRoleFilter)
    );
  });

  const filteredQuotes = quotesList.filter(q =>
    (q.cliente?.nombre?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
     q.cliente?.email?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
     q.id?.toLowerCase().includes(quoteSearchTerm.toLowerCase())) &&
    (quoteStatusFilter === 'todos' || q.estado === quoteStatusFilter)
  );

  const totals = getQuoteTotals();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[90vh] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.07),transparent)] -z-10" />

      <div className="relative max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-outfit">
              <ShieldAlert className="w-8 h-8 text-cyan-400" />
              Panel de Administración
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gestiona cotizaciones, calcula costos en tiempo real y administra usuarios.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold capitalize bg-slate-900 border border-slate-800 text-cyan-400">
            Rol: {profile?.rol}
          </span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => { setActiveTab('cotizaciones'); setError(null); }}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cotizaciones'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cotizaciones
          </button>

          {profile?.rol === 'administrador' && (
            <button
              onClick={() => { setActiveTab('usuarios'); setError(null); }}
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'usuarios'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
          )}
        </div>

        {/* ── Contenido ── */}
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════════
              TAB: COTIZACIONES
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'cotizaciones' && (
            <motion.div
              key="cotizaciones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: quotesList.length, color: 'text-white' },
                  { label: 'Pendientes', value: quotesList.filter(q => q.estado === 'pendiente').length, color: 'text-amber-400' },
                  { label: 'Cotizadas', value: quotesList.filter(q => q.estado === 'cotizado').length, color: 'text-cyan-400' },
                  { label: 'Aceptadas', value: quotesList.filter(q => q.estado === 'aceptado').length, color: 'text-emerald-400' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                    <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                      {kpi.label}
                    </div>
                    <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Dos columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ── Columna izquierda: lista ── */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
                  <h2 className="text-sm font-bold text-white px-1">Búsqueda y Filtros</h2>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente o ID..."
                      value={quoteSearchTerm}
                      onChange={e => setQuoteSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/40 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 shrink-0">Estado:</span>
                    <select
                      value={quoteStatusFilter}
                      onChange={e => setQuoteStatusFilter(e.target.value)}
                      className="flex-1 py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="cotizado">Cotizadas</option>
                      <option value="aceptado">Aceptadas</option>
                      <option value="rechazado">Rechazadas</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-800 pt-3 max-h-[520px] overflow-y-auto space-y-2 pr-1">
                    {quotesFetching ? (
                      <div className="py-10 text-center text-slate-500 text-xs">Cargando...</div>
                    ) : filteredQuotes.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-xs">Sin resultados</div>
                    ) : (
                      filteredQuotes.map(q => (
                        <button
                          key={q.id}
                          onClick={() => handleSelectQuote(q)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                            selectedQuote?.id === q.id
                              ? 'bg-slate-800/40 border-cyan-500/50 shadow shadow-cyan-500/5'
                              : 'bg-slate-950/30 border-slate-800 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold truncate max-w-[120px]">
                              {q.id}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${estadoBadgeClass(q.estado)}`}>
                              {q.estado}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate">
                            {q.cliente?.nombre || 'Sin nombre'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {q.productos?.length || 0} producto{q.productos?.length !== 1 ? 's' : ''}
                          </span>
                          {q.precioTotalCotizacion > 0 && (
                            <span className="text-xs font-bold text-emerald-400">
                              {formatCOP(q.precioTotalCotizacion)}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* ── Columna derecha: detalle + calculadora ── */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedQuote ? (
                    <div className="space-y-6">

                      {/* Cabecera del cliente */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              Cotización
                            </span>
                            <h2 className="text-2xl font-extrabold text-white">{selectedQuote.cliente?.nombre}</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2">
                              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedQuote.cliente?.email}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedQuote.cliente?.telefono}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Estado</span>
                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${estadoBadgeClass(selectedQuote.estado)}`}>
                              {selectedQuote.estado}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 select-all">{selectedQuote.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* ── CONFIGURACIÓN GLOBAL DE FABRICACIÓN ── */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                        <button
                          type="button"
                          onClick={() => setShowGlobalConfig(v => !v)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-bold text-white">Variables Globales de Fabricación</span>
                            <span className="text-[10px] text-slate-500 ml-1">
                              (Kw/h: ${precioKwhHora.toLocaleString('es-CO')} · Filamento: ${precioFilamentoKg.toLocaleString('es-CO')}/kg)
                            </span>
                          </div>
                          {showGlobalConfig ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        <AnimatePresence>
                          {showGlobalConfig && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Precio Kw/h */}
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Precio Energía (COP / Kw·h)</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
                                    <input
                                      type="number"
                                      value={precioKwhHora}
                                      onChange={e => setPrecioKwhHora(parseFloat(e.target.value) || 0)}
                                      className="w-full pl-7 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-cyan-500/40"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1.5">
                                    → <span className="text-yellow-400/80 font-semibold">{(precioKwhHora / 60).toFixed(2)} COP/min</span> de impresión
                                  </p>
                                </div>

                                {/* Precio filamento */}
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-blue-400" /> Precio Filamento (COP / kg)</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
                                    <input
                                      type="number"
                                      value={precioFilamentoKg}
                                      onChange={e => setPrecioFilamentoKg(parseFloat(e.target.value) || 0)}
                                      className="w-full pl-7 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-cyan-500/40"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1.5">
                                    → <span className="text-blue-400/80 font-semibold">{(precioFilamentoKg / 1000).toFixed(2)} COP/g</span> de plástico
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── CALCULADORA POR PRODUCTO ── */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-white px-1">Cotizaciones pendientes y cálculo por producto</h3>

                        {selectedQuote.productos.map((producto: any, idx: number) => {
                          const c = calcProduct(idx, producto.unidades);
                          const vals = calcValues[idx] || { duracion: '0', filamento: '0', valorEmpaque: '0', valorPersonalizacion: '0', ganancia: '30' };

                          return (
                            <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">

                              {/* Header del producto */}
                              <div className="bg-slate-950/60 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{producto.nombre}</h4>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {producto.tamanoHorizontal} × {producto.tamanoVertical} mm ·{' '}
                                    <span className="text-slate-300 font-semibold">{producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''}</span>
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-cyan-400 px-3 py-1 bg-cyan-950/20 border border-cyan-800/20 rounded-lg shrink-0">
                                  Producto #{idx + 1}
                                </span>
                              </div>

                              {/* Info del cliente: requerimientos + foto */}
                              <div className="px-5 py-4 border-b border-slate-800/50 bg-slate-950/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Accesorios</span>
                                    <p className="text-xs text-slate-300 mt-1">{producto.accesorios || 'Ninguno'}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Personalización</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {producto.personalizacion?.length > 0 ? (
                                        producto.personalizacion.map((pz: string, pIdx: number) => (
                                          <span key={pIdx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 capitalize">
                                            {pz === 'otra' ? `Otra: ${producto.personalizacionOtraText || ''}` : pz}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-slate-500">Sin personalización</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Empaque</span>
                                    <p className="text-xs text-slate-300 mt-1 capitalize">
                                      {producto.empaque === 'otra'
                                        ? `Otro: ${producto.empaqueOtraText || ''}`
                                        : producto.empaque}
                                    </p>
                                  </div>
                                </div>

                                {/* Foto */}
                                <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-3">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                    Foto Referencial
                                  </span>
                                  {producto.imagenUrl ? (
                                    <a
                                      href={producto.imagenUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 bg-slate-950 flex items-center justify-center group transition-all"
                                    >
                                      <img
                                        src={producto.imagenUrl}
                                        alt="Referencia"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
                                        <Eye className="w-4 h-4" /> Ampliar
                                      </div>
                                    </a>
                                  ) : (
                                    <div className="w-28 h-28 rounded-lg border border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
                                      <ImageIcon className="w-6 h-6 mb-1 text-slate-700" />
                                      <span className="text-[9px]">Sin foto</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* ── CALCULADORA ── */}
                              <div className="px-5 py-5 space-y-5">
                                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4 text-cyan-400" />
                                  Asignación de Costos y Variables
                                </p>

                                {/* Inputs de entrada */}
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">

                                  {/* Duración */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Duración (min)
                                    </label>
                                    <div className="relative">
                                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                      <input
                                        type="number"
                                        min="0"
                                        value={vals.duracion}
                                        onChange={e => handleCalcChange(idx, 'duracion', e.target.value)}
                                        className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500/40"
                                      />
                                    </div>
                                    <p className="text-[9px] text-yellow-400/70">
                                      = {formatCOP(c.costoEnergiaUnitario)}/u
                                    </p>
                                  </div>

                                  {/* Filamento */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Filamento (g)
                                    </label>
                                    <div className="relative">
                                      <Weight className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                      <input
                                        type="number"
                                        min="0"
                                        value={vals.filamento}
                                        onChange={e => handleCalcChange(idx, 'filamento', e.target.value)}
                                        className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500/40"
                                      />
                                    </div>
                                    <p className="text-[9px] text-blue-400/70">
                                      = {formatCOP(c.costoFilamentoUnitario)}/u
                                    </p>
                                  </div>

                                  {/* Ganancia */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Ganancia (%)
                                    </label>
                                    <div className="relative">
                                      <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                      <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        value={vals.ganancia}
                                        onChange={e => handleCalcChange(idx, 'ganancia', e.target.value)}
                                        className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-cyan-500/40"
                                      />
                                    </div>
                                    <p className="text-[9px] text-emerald-400/70">
                                      + {formatCOP(c.gananciaTotal / (producto.unidades || 1))}/u
                                    </p>
                                  </div>

                                  {/* Precio unitario calculado */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Precio unitario
                                    </label>
                                    <input
                                      type="text"
                                      readOnly
                                      value={formatCOP(c.precioUnitario)}
                                      className="w-full px-2.5 py-2 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-bold focus:outline-none text-right"
                                    />
                                    <p className="text-[9px] text-slate-500">Base + ganancia</p>
                                  </div>

                                  {/* Valor personalización */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Personaliz. ($/u)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vals.valorPersonalizacion}
                                      onChange={e => handleCalcChange(idx, 'valorPersonalizacion', e.target.value)}
                                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500/40 text-right"
                                    />
                                    <p className="text-[9px] text-slate-500">Por unidad</p>
                                  </div>

                                  {/* Valor empaque */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Empaque ($/u)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vals.valorEmpaque}
                                      onChange={e => handleCalcChange(idx, 'valorEmpaque', e.target.value)}
                                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500/40 text-right"
                                    />
                                    <p className="text-[9px] text-slate-500">Por unidad</p>
                                  </div>
                                </div>

                                {/* Resultados desglosados */}
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                                    Resumen de Costos — {producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''}
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Costo Fabricación Base/u:
                                      </span>
                                      <span className="font-semibold text-slate-300">
                                        {formatCOP(c.costoFabricacionUnitario)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        (⚡{formatCOP(c.costoEnergiaUnitario)} + 🧵{formatCOP(c.costoFilamentoUnitario)})
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Precio Unitario/u:
                                      </span>
                                      <span className="font-bold text-cyan-400">
                                        {formatCOP(c.precioUnitario)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        Fabricación + ganancia
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Subtotal Fabricación Total:
                                      </span>
                                      <span className="font-semibold text-slate-200">
                                        {formatCOP(c.subtotalFabricacionTotal)}
                                      </span>
                                      <span className="block text-[9px] text-emerald-400/80 mt-0.5">
                                        Ganancia: {formatCOP(c.gananciaTotal)}
                                      </span>
                                    </div>

                                    <div className="border-l border-slate-800 pl-4">
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Precio Total Producto:
                                      </span>
                                      <span className="font-extrabold text-emerald-400 text-sm">
                                        {formatCOP(c.precioTotalProducto)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        {formatCOP(c.precioTotalUnitario)}/u inc. empaque y personaliz.
                                      </span>
                                    </div>

                                  </div>
                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── TOTALES Y ACCIONES ── */}
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                          {/* Totales */}
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              Totales de la Cotización
                            </p>
                            <div className="grid grid-cols-3 gap-6 mt-2 text-xs text-slate-400">
                              <div>
                                <span className="block">Subtotal Fabricación:</span>
                                <span className="font-bold text-slate-200">{formatCOP(totals.subtotalFabricacion)}</span>
                              </div>
                              <div>
                                <span className="block">Valor Ganancia:</span>
                                <span className="font-bold text-cyan-400">{formatCOP(totals.ganancia)}</span>
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-white">Precio Total:</span>
                                <span className="font-extrabold text-emerald-400 text-2xl">{formatCOP(totals.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <button
                              disabled={saving}
                              onClick={() => handleSaveQuote('cotizado')}
                              className="py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
                            >
                              {saving ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Guardar y Enviar Cotización
                            </button>

                            <div className="flex gap-2">
                              <button
                                disabled={saving}
                                onClick={() => handleSaveQuote('aceptado')}
                                className="flex-1 py-3 px-4 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                Aceptada
                              </button>
                              <button
                                disabled={saving}
                                onClick={() => handleSaveQuote('rechazado')}
                                className="flex-1 py-3 px-4 bg-red-900/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                Rechazada
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl p-20 text-center text-slate-500">
                      <FileText className="w-14 h-14 mx-auto mb-4 text-slate-800" />
                      <p className="text-base font-bold text-slate-400">Ninguna Cotización Seleccionada</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Elige una solicitud de la lista lateral para procesarla.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: USUARIOS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'usuarios' && (
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
                  <span className="text-slate-400 text-sm font-medium">Filtrar Rol:</span>
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
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
