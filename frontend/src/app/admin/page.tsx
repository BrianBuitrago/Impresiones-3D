'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  FileText,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Colaborador } from '@/types/reportes';
import { fetchColaboradores, crearReporte } from '@/services/reporteService';
import { fetchQuotes as fetchQuotesApi, actualizarQuote, actualizarSubEstado } from '@/services/quoteService';
import QuotesTab from './components/QuotesTab';
import UsersTab from './components/UsersTab';
import PreciosTab from './components/PreciosTab';
import ComprasTab from './components/ComprasTab';
import AssignColaboradorDialog from './components/AssignColaboradorDialog';
import { type CalcEntry } from './components/shared';
import { calcProduct as calcProductPure, getQuoteTotals as getQuoteTotalsPure, mapProductoConCalculo as mapProductoConCalculoPure, type PricingContext } from '@/utils/quotePricing';
import { generateQuotePdfAndOpenWhatsApp } from '@/utils/generateQuotePdf';
import { buildQuoteReportItems } from '@/utils/buildQuoteReportItems';
import Spinner from '@/components/ui/Spinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Mismo formato que admin/reportes/page.tsx (el backend exige "MM/AA", ej. "Agosto/26")
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ReportItemInput {
  quoteId: string;
  productoId: string;
  categoria: string;
  descripcion: string;
  actividad: string;
  cantidad: string;
  valor: string;
  notas: string;
}

interface ReportForm {
  colaboradorUid: string;
  colaboradorNombre: string;
  periodo: string;
  categorias: string[];
  notas: string;
  items: ReportItemInput[];
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'usuarios' | 'reportes' | 'compras' | 'precios'>('cotizaciones');
  const [autoExpandCompraId, setAutoExpandCompraId] = useState<string | null>(null);

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

  // Reportes
  const [reportTab, setReportTab] = useState<'cotizaciones' | 'usuarios' | 'reportes'>('cotizaciones');
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportsFetching, setReportsFetching] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportForm, setReportForm] = useState<ReportForm>({
    colaboradorUid: profile?.uid || '',
    colaboradorNombre: profile?.nombre || '',
    periodo: '',
    categorias: profile?.categorias || [],
    notas: '',
    items: [],
  });

  // Variables globales de fabricación (editables en el panel, ver también pestaña "Precios")
  const [precioKwhHora, setPrecioKwhHora] = useState<number>(900);
  // Precio por minuto: constante propia (no derivada de precioKwhHora/60), se usa como
  // costo de energía por defecto cuando el producto no trae un consumo (kW) específico.
  const [precioKwhMinuto, setPrecioKwhMinuto] = useState<number>(15);
  const [precioFilamentoKg, setPrecioFilamentoKg] = useState<number>(85000);
  const [showGlobalConfig, setShowGlobalConfig] = useState(false);

  // Cargar los precios base persistidos (settings/precios) para usarlos como punto de partida
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', 'precios'));
        if (snap.exists()) {
          const data = snap.data() as { precioKwhHora?: number; precioKwhMinuto?: number; precioFilamentoKg?: number };
          if (typeof data.precioKwhHora === 'number') setPrecioKwhHora(data.precioKwhHora);
          if (typeof data.precioKwhMinuto === 'number') setPrecioKwhMinuto(data.precioKwhMinuto);
          if (typeof data.precioFilamentoKg === 'number') setPrecioFilamentoKg(data.precioFilamentoKg);
        }
      } catch { /* usa los valores por defecto */ }
    })();
  }, []);

  // Cálculos por producto (index → valores)
  const [calcValues, setCalcValues] = useState<{ [key: number]: CalcEntry }>({});

  // Controla qué producto está expandido en la UI para reducir el desorden
  const [openProductIndex, setOpenProductIndex] = useState<number | null>(null);

  // Guardando cotización
  const [saving, setSaving] = useState(false);

  // Asignación de colaborador al aceptar cotización
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignColaboradores, setAssignColaboradores] = useState<Colaborador[]>([]);
  const [assignMode, setAssignMode] = useState<'all' | 'perItem'>('perItem');
  const [assignAllUid, setAssignAllUid] = useState('');
  const [perItemAssignments, setPerItemAssignments] = useState<Record<number, string>>({});
  // Empaque/caja y personalización/pintura de un mismo producto pueden ser
  // trabajo de colaboradores distintos al de fabricación (o del propio
  // dueño, si se deja "sin asignar") — se registran aparte para que cada
  // quien reciba el pago exacto de su parte, en vez de todo junto.
  const [perItemEmpaqueAssignments, setPerItemEmpaqueAssignments] = useState<Record<number, string>>({});
  const [perItemPersonalizacionAssignments, setPerItemPersonalizacionAssignments] = useState<Record<number, string>>({});
  const [perItemTrabajos, setPerItemTrabajos] = useState<Record<number, Array<{ tempId: string; descripcion: string; valor: number; colaboradorUid: string }>>>({});
  const [assignSaving, setAssignSaving] = useState(false);

  // ── Cargar cotizaciones desde backend seguro ─────────────────────

  const fetchQuotes = async () => {
    if (!token || (profile?.rol !== 'administrador' && profile?.rol !== 'colaborador')) return;
    setQuotesFetching(true);
    setError(null);
    try {
      setQuotesList(await fetchQuotesApi(token));
    } catch (err: any) {
      setError(err.message || 'Error al cargar cotizaciones.');
    } finally {
      setQuotesFetching(false);
    }
  };

  useEffect(() => {
    if (!user || (profile?.rol !== 'administrador' && profile?.rol !== 'colaborador')) return;
    fetchQuotes();
  }, [user, profile, token]);

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

  // ── Reportes: cargar lista cuando el admin vea la pestaña
  const fetchReports = async () => {
    if (!token || profile?.rol !== 'administrador') return;
    setReportsFetching(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudieron cargar los reportes.');
      setReportsList(await res.json());
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes.');
    } finally {
      setReportsFetching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reportes' && profile?.rol === 'administrador') fetchReports();
  }, [activeTab, profile, token]);

  const handleSelectReport = (r: any) => {
    setSelectedReport(r);
  };

  const [showReportForm, setShowReportForm] = useState(false);

  const handleReportFormChange = (field: keyof ReportForm, value: any) => {
    setReportForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddReportItem = () => {
    setReportForm(prev => ({ ...prev, items: [...prev.items, { quoteId: '', productoId: '', categoria: '', descripcion: '', actividad: '', cantidad: '1', valor: '0', notas: '' }] }));
  };

  const handleRemoveReportItem = (index: number) => {
    setReportForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleCreateReport = async () => {
    if (!token) return setError('No autenticado');
    setError(null);
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reportForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo crear el reporte.');
      }
      const created = await res.json();
      setReportsList(prev => [created, ...prev]);
      setShowReportForm(false);
      setReportForm({ colaboradorUid: profile?.uid || '', colaboradorNombre: profile?.nombre || '', periodo: '', categorias: profile?.categorias || [], notas: '', items: [] });
    } catch (err: any) {
      setError(err.message || 'Error al crear reporte.');
    }
  };

  // ── Inicializar calcValues al seleccionar cotización ──────────────────────

  useEffect(() => {
    if (!selectedQuote) return;
    const init: { [k: number]: CalcEntry } = {};
    selectedQuote.productos.forEach((p: any, idx: number) => {
      const duracion = Number(p.duracionImpresionUnidad || 0);
      init[idx] = {
        tiempoHoras: (p.tiempoHoras ?? Math.floor(duracion / 60)).toString(),
        tiempoMinutos: (p.tiempoMinutos ?? duracion % 60).toString(),
        pesoGramos: (p.pesoGramos ?? p.filamentoUsadoUnidad ?? 0).toString(),
        costoDiseno: (p.costoDisenoUnitario ?? 0).toString(),
        costoAccesorios: (p.costoAccesoriosUnitario ?? 0).toString(),
        costoEmpaque: (p.valorEmpaqueUnitario ?? 0).toString(),
        costoPersonalizado: (p.valorPersonalizacionUnitario ?? 0).toString(),
        horasPostProcesado: (p.horasPostProcesado ?? 0).toString(),
        costoProcesado: (p.costoProcesado ?? 0).toString(),
        porcentajeImprevistos: (p.porcentajeImprevistos ?? 0).toString(),
        kwH: (p.kwH ?? 0).toString(),
        kwMin: (p.kwMin ?? 0).toString(),
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
    if (typeof quote.precioKwhMinuto === 'number') {
      setPrecioKwhMinuto(quote.precioKwhMinuto);
    }
    if (typeof quote.precioFilamentoKg === 'number') {
      setPrecioFilamentoKg(quote.precioFilamentoKg);
    }
  };

  // ── Cálculos matemáticos por producto ─────────────────────────────────────
  // La matemática vive en utils/quotePricing.ts (extraída para acortar este
  // archivo y poder probarla aparte); acá solo se arma el contexto con el
  // estado del panel y se envuelve con las firmas originales (idx, unidades)
  // para no tener que tocar QuotesTab/AssignColaboradorDialog, que reciben
  // estas funciones como props.
  const pricingCtx: PricingContext = { calcValues, precioKwhHora, precioKwhMinuto, precioFilamentoKg };
  const calcProduct = (idx: number, unidades: number) => calcProductPure(idx, unidades, pricingCtx);
  const getQuoteTotals = () => getQuoteTotalsPure(selectedQuote, pricingCtx);
  const mapProductoConCalculo = (p: any, idx: number) => mapProductoConCalculoPure(p, idx, pricingCtx);

  // ── Guardar cotización ────────────────────────────────────────────────────

  const handleSaveQuote = async (newStatus: string, subEstado?: string) => {
    if (!selectedQuote || !token) return;

    // Si es aceptado, primero mostrar diálogo de asignación de colaborador
    if (newStatus === 'aceptado') {
      try {
        const cols = await fetchColaboradores(token);
        setAssignColaboradores(cols);
        setAssignMode('perItem');
        setAssignAllUid('');
        const init: Record<number, string> = {};
        const initEmpaque: Record<number, string> = {};
        const initPersonalizacion: Record<number, string> = {};
        const initTrab: Record<number, Array<{ tempId: string; descripcion: string; valor: number; colaboradorUid: string }>> = {};
        selectedQuote.productos.forEach((_: any, idx: number) => { init[idx] = ''; initEmpaque[idx] = ''; initPersonalizacion[idx] = ''; initTrab[idx] = []; });
        setPerItemAssignments(init);
        setPerItemEmpaqueAssignments(initEmpaque);
        setPerItemPersonalizacionAssignments(initPersonalizacion);
        setPerItemTrabajos(initTrab);
        setShowAssignDialog(true);
      } catch { /* si falla carga, proceder sin asignación */ }
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updatedProductos = selectedQuote.productos.map(mapProductoConCalculo);

      const { subtotalFabricacion, ganancia, total } = getQuoteTotals();

      const updatedQuote = await actualizarQuote(token, selectedQuote.id, {
        productos: updatedProductos,
        estado: newStatus,
        ...(subEstado ? { subEstado } : {}),
        precioKwhHora,
        precioKwhMinuto,
        precioFilamentoKg,
        subtotalFabricacionTotal: Math.round(subtotalFabricacion * 100) / 100,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        porcentajeGanancia: updatedProductos.length > 0
          ? Math.round((updatedProductos.reduce((acc: number, p: any) => acc + (p.porcentajeGanancia || 0), 0) / updatedProductos.length) * 100) / 100
          : 30,
        notasCotizacion: selectedQuote.notasCotizacion || '',
      });
      setSelectedQuote(updatedQuote);
      setQuotesList(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    } catch (err: any) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Cambia el sub-estado de una cotización aceptada. Usa el endpoint dedicado
  // (PATCH .../subestado) que solo toca ese campo, sin precios ni productos —
  // es lo único que un colaborador puede modificar de una cotización.
  const handleUpdateSubEstado = async (quote: any, newSubEstado: string) => {
    if (!token) return;
    setError(null);
    try {
      const updatedQuote = await actualizarSubEstado(token, quote.id, newSubEstado);
      setQuotesList(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
      if (selectedQuote?.id === updatedQuote.id) setSelectedQuote(updatedQuote);
    } catch (err: any) {
      setError('Error al actualizar el sub-estado: ' + err.message);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedQuote || !token) return;
    setAssignSaving(true);
    setError(null);
    try {
      const colsDisponibles = assignColaboradores;
      // El reparto de productos entre colaboradores (empaque/personalización
      // aparte, trabajos sueltos) es pura lógica, sin llamadas a la API ni
      // setState — vive en utils/buildQuoteReportItems.ts.
      const itemsPorColaborador = buildQuoteReportItems(selectedQuote, {
        assignMode, assignAllUid, perItemAssignments,
        perItemEmpaqueAssignments, perItemPersonalizacionAssignments, perItemTrabajos,
      }, pricingCtx);

      // Save quote as aceptado
      const updatedProductos = selectedQuote.productos.map(mapProductoConCalculo);

      const { subtotalFabricacion, ganancia, total } = getQuoteTotals();

      const updatedQuote = await actualizarQuote(token, selectedQuote.id, {
        productos: updatedProductos,
        estado: 'aceptado',
        subEstado: 'diseñando',
        precioKwhHora,
        precioKwhMinuto,
        precioFilamentoKg,
        subtotalFabricacionTotal: Math.round(subtotalFabricacion * 100) / 100,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        porcentajeGanancia: updatedProductos.length > 0
          ? Math.round((updatedProductos.reduce((acc: number, p: any) => acc + (p.porcentajeGanancia || 0), 0) / updatedProductos.length) * 100) / 100
          : 30,
        notasCotizacion: selectedQuote.notasCotizacion || '',
      });
      setSelectedQuote(updatedQuote);
      setQuotesList(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));

      // Create report entries for assigned products
      const now = new Date();
      const periodo = `${MONTHS[now.getMonth()]}/${String(now.getFullYear()).slice(-2)}`;
      for (const [colUid, items] of itemsPorColaborador) {
        const col = colUid === '__sin_asignar__' ? null : colsDisponibles.find(c => c.uid === colUid);
        await crearReporte(token, {
          colaboradorUid: colUid,
          colaboradorNombre: col?.nombre || 'Sin Asignar',
          periodo,
          categorias: col?.categorias || [],
          items,
          notas: `Cotización #${selectedQuote.id} aceptada`,
        });
      }

      setShowAssignDialog(false);
      setSelectedQuote(null);
      setAutoExpandCompraId(updatedQuote.id);
      setActiveTab('compras');
    } catch (err: any) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setAssignSaving(false);
    }
  };

  // Rechaza la cotización y le avisa al cliente por WhatsApp (mismo número
  // desde el que se escribe, así que "cualquier duda, responde por acá" es
  // literal: es la misma conversación).
  const handleRejectQuote = () => {
    if (!selectedQuote) return;
    const cliente = selectedQuote.cliente || {};
    const clienteNombre = cliente.nombre || 'Cliente';
    const clienteTelefono = String(cliente.telefono || '').replace(/[^0-9]/g, '');

    if (!clienteTelefono) {
      setError('El teléfono del cliente no es válido para WhatsApp. Verifica el número en la cotización.');
      return;
    }
    setError(null);

    const message = `Hola ${clienteNombre}, te escribimos de RepliCars3D para contarte que tu cotización (Referencia: ${selectedQuote.id}) no pudo ser aprobada en esta ocasión. Cualquier duda, escríbenos por este mismo número. ¡Gracias por tu interés!`;
    const waUrl = `https://wa.me/${clienteTelefono}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    handleSaveQuote('rechazado');
  };

  // La generación del PDF (jsPDF, layout, imágenes de productos) vive en
  // utils/generateQuotePdf.ts — acá solo se arma el mensaje de error si el
  // cliente no tiene teléfono válido (el util lanza un Error con ese texto).
  const handleGeneratePdfAndOpenWhatsApp = async () => {
    if (!selectedQuote) return;
    setError(null);
    try {
      await generateQuotePdfAndOpenWhatsApp(selectedQuote, getQuoteTotals());
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el PDF.');
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────────
  // OJO: tienen que estar ANTES de los early return de "Guards" — son hooks
  // (useMemo), y los hooks no pueden llamarse condicionalmente ni después de
  // un return temprano (violaría las Reglas de los Hooks: si "loading" es
  // true el componente vuelve antes de llegar acá, así que en ese render
  // estos hooks nunca se ejecutarían, cambiando la cantidad/orden de hooks
  // entre renders -> React tira el error #310 "Rendered more hooks than
  // during the previous render". Estaban puestos después de los guards
  // cuando eran simples const, lo cual no importaba porque no eran hooks;
  // al envolverlos en useMemo había que moverlos para acá.

  // Este componente tiene mucho estado (inputs de cálculo, formulario de
  // reportes, diálogo de asignación) que cambia con cada tecla; sin useMemo,
  // estos tres cálculos se repetían en cada uno de esos renders aunque sus
  // propias dependencias no hubieran cambiado (usersList/quotesList pueden
  // tener hasta 1000/2000 registros por el límite defensivo del backend).
  const filteredUsers = useMemo(() => usersList.filter(u => {
    const q = userSearchTerm.toLowerCase();
    return (
      (u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cedula?.includes(q)) &&
      (userRoleFilter === 'todos' || u.rol === userRoleFilter)
    );
  }), [usersList, userSearchTerm, userRoleFilter]);

  const filteredQuotes = useMemo(() => quotesList.filter(q =>
    (q.cliente?.nombre?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
     q.cliente?.email?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
     q.id?.toLowerCase().includes(quoteSearchTerm.toLowerCase())) &&
    (quoteStatusFilter === 'todos' || q.estado === quoteStatusFilter)
  ), [quotesList, quoteSearchTerm, quoteStatusFilter]);

  // El contexto se arma acá adentro (no se reutiliza el `pricingCtx` ya
  // declarado arriba) para que las dependencias del memo sean los valores
  // primitivos reales, no un objeto que de por sí es distinto en cada render.
  const totals = useMemo(
    () => getQuoteTotalsPure(selectedQuote, { calcValues, precioKwhHora, precioKwhMinuto, precioFilamentoKg }),
    [selectedQuote, calcValues, precioKwhHora, precioKwhMinuto, precioFilamentoKg]
  );

  // ── Guards ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="2xl" />
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
        {/* overflow-x-auto: con hasta 6 pestañas no entran en una pantalla de
            celular sin esto — antes se salían del contenedor y provocaban
            scroll horizontal de toda la página. shrink-0 en cada botón evita
            que el navegador las achique/apriete en vez de dejarlas scrollear. */}
        <div className="flex overflow-x-auto border-b border-slate-800">
          <button
            onClick={() => { setActiveTab('cotizaciones'); setError(null); }}
            className={`shrink-0 whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
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
              className={`shrink-0 whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'usuarios'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
          )}
          {profile?.rol === 'administrador' && (
            <button
              onClick={() => { setActiveTab('precios'); setError(null); }}
              className={`shrink-0 whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'precios'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Precios
            </button>
          )}
          {(profile?.rol === 'administrador' || profile?.rol === 'colaborador') && (
            <button
              onClick={() => { setActiveTab('compras'); setError(null); }}
              className={`shrink-0 whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'compras'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Compras
            </button>
          )}
          {profile?.rol === 'administrador' && (
            <button
              onClick={() => router.push('/admin/reportes')}
              className="shrink-0 whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer border-transparent text-slate-400 hover:text-slate-200"
            >
              <BarChart3 className="w-4 h-4" />
              Reportes
            </button>
          )}
          {profile?.rol === 'administrador' && (
            <button
              onClick={() => router.push('/admin/inversiones')}
              className="shrink-0 whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer border-transparent text-slate-400 hover:text-slate-200"
            >
              <Wallet className="w-4 h-4" />
              Inversiones
            </button>
          )}
        </div>

        {/* ── Contenido ── */}
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════════
              TAB: COTIZACIONES
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'cotizaciones' && (
            <QuotesTab
              isColaborador={profile?.rol === 'colaborador'}
              quotesList={quotesList}
              quotesFetching={quotesFetching}
              selectedQuote={selectedQuote}
              quoteSearchTerm={quoteSearchTerm}
              setQuoteSearchTerm={setQuoteSearchTerm}
              quoteStatusFilter={quoteStatusFilter}
              setQuoteStatusFilter={setQuoteStatusFilter}
              filteredQuotes={filteredQuotes}
              error={error}
              fetchQuotes={fetchQuotes}
              handleSelectQuote={handleSelectQuote}
              precioKwhHora={precioKwhHora}
              setPrecioKwhHora={setPrecioKwhHora}
              precioKwhMinuto={precioKwhMinuto}
              setPrecioKwhMinuto={setPrecioKwhMinuto}
              precioFilamentoKg={precioFilamentoKg}
              setPrecioFilamentoKg={setPrecioFilamentoKg}
              showGlobalConfig={showGlobalConfig}
              setShowGlobalConfig={setShowGlobalConfig}
              calcValues={calcValues}
              handleCalcChange={handleCalcChange}
              openProductIndex={openProductIndex}
              setOpenProductIndex={setOpenProductIndex}
              calcProduct={calcProduct}
              totals={totals}
              saving={saving}
              handleSaveQuote={handleSaveQuote}
              handleGeneratePdfAndOpenWhatsApp={handleGeneratePdfAndOpenWhatsApp}
              handleRejectQuote={handleRejectQuote}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: USUARIOS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'usuarios' && (
            <UsersTab
              usersList={usersList}
              filteredUsers={filteredUsers}
              usersFetching={usersFetching}
              error={error}
              fetchUsers={fetchUsers}
              userSearchTerm={userSearchTerm}
              setUserSearchTerm={setUserSearchTerm}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              successUid={successUid}
              updatingUid={updatingUid}
              handleRoleChange={handleRoleChange}
            />
          )}

          {activeTab === 'precios' && <PreciosTab />}

          {activeTab === 'compras' && (
            <ComprasTab
              isColaborador={profile?.rol === 'colaborador'}
              quotesList={quotesList}
              handleUpdateSubEstado={handleUpdateSubEstado}
              autoExpandId={autoExpandCompraId}
              onAutoExpandHandled={() => setAutoExpandCompraId(null)}
            />
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAssignDialog && (
          <AssignColaboradorDialog
            selectedQuote={selectedQuote}
            assignColaboradores={assignColaboradores}
            assignMode={assignMode}
            setAssignMode={setAssignMode}
            assignAllUid={assignAllUid}
            setAssignAllUid={setAssignAllUid}
            perItemAssignments={perItemAssignments}
            setPerItemAssignments={setPerItemAssignments}
            perItemEmpaqueAssignments={perItemEmpaqueAssignments}
            setPerItemEmpaqueAssignments={setPerItemEmpaqueAssignments}
            perItemPersonalizacionAssignments={perItemPersonalizacionAssignments}
            setPerItemPersonalizacionAssignments={setPerItemPersonalizacionAssignments}
            perItemTrabajos={perItemTrabajos}
            setPerItemTrabajos={setPerItemTrabajos}
            assignSaving={assignSaving}
            handleConfirmAssign={handleConfirmAssign}
            setShowAssignDialog={setShowAssignDialog}
            calcProduct={calcProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
