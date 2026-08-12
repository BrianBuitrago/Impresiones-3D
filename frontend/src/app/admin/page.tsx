'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  FileText,
  BarChart3,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Colaborador, ReportItem } from '@/types/reportes';
import { fetchColaboradores, crearReporte } from '@/services/reporteService';
import { fetchQuotes as fetchQuotesApi, actualizarQuote } from '@/services/quoteService';
import QuotesTab from './components/QuotesTab';
import UsersTab from './components/UsersTab';
import PreciosTab from './components/PreciosTab';
import ComprasTab from './components/ComprasTab';
import AssignColaboradorDialog from './components/AssignColaboradorDialog';
import { formatCOP, type CalcEntry } from './components/shared';

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
  const [precioFilamentoKg, setPrecioFilamentoKg] = useState<number>(85000);
  const [showGlobalConfig, setShowGlobalConfig] = useState(false);

  // Cargar los precios base persistidos (settings/precios) para usarlos como punto de partida
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', 'precios'));
        if (snap.exists()) {
          const data = snap.data() as { precioKwhHora?: number; precioFilamentoKg?: number };
          if (typeof data.precioKwhHora === 'number') setPrecioKwhHora(data.precioKwhHora);
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
        tiempoHoras: (p.tiempoHoras ?? p.Tiempo_Horas ?? Math.floor(duracion / 60)).toString(),
        tiempoMinutos: (p.tiempoMinutos ?? p.Tiempo_Minutos ?? duracion % 60).toString(),
        pesoGramos: (p.pesoGramos ?? p.Peso_Gramos ?? p.filamentoUsadoUnidad ?? 0).toString(),
        costoDiseno: (p.costoDisenoUnitario ?? p['Costo_Diseño'] ?? p.Costo_Diseno ?? 0).toString(),
        costoAccesorios: (p.costoAccesoriosUnitario ?? p.Costo_Accesorios ?? 0).toString(),
        costoEmpaque: (p.valorEmpaqueUnitario ?? p.Costo_Empaque ?? 0).toString(),
        costoPersonalizado: (p.valorPersonalizacionUnitario ?? p.Costo_Personalizado ?? 0).toString(),
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
    const v = calcValues[idx] || {
      tiempoHoras: '0',
      tiempoMinutos: '0',
      pesoGramos: '0',
      costoDiseno: '0',
      costoAccesorios: '0',
      costoEmpaque: '0',
      costoPersonalizado: '0',
      horasPostProcesado: '0',
      costoProcesado: '0',
      porcentajeImprevistos: '0',
      kwH: '0',
      kwMin: '0',
      ganancia: '30',
    };

    const tiempoHoras      = parseFloat(v.tiempoHoras) || 0;
    const tiempoMinutos    = parseFloat(v.tiempoMinutos) || 0;
    const duracion         = tiempoHoras * 60 + tiempoMinutos;
    const filamento        = parseFloat(v.pesoGramos) || 0;
    const costoDiseno      = parseFloat(v.costoDiseno) || 0;
    const costoAccesorios  = parseFloat(v.costoAccesorios) || 0;
    const valorEmpaque     = parseFloat(v.costoEmpaque) || 0;
    const valorPersonalizacion = parseFloat(v.costoPersonalizado) || 0;
    const horasProcesado   = parseFloat(v.horasPostProcesado) || 0;
    const costoProcesado   = parseFloat(v.costoProcesado) || 0;
    const imprevistos      = parseFloat(v.porcentajeImprevistos) || 0;
    const kwH              = parseFloat(v.kwH) || 0;
    const kwMin            = parseFloat(v.kwMin) || 0;
    const ganancia          = parseFloat(v.ganancia) || 0;

    const precioKwhMinuto           = precioKwhHora / 60;
    const costoEnergiaUnitario      = (kwH > 0 || kwMin > 0)
      ? (kwH * tiempoHoras + kwMin * tiempoMinutos / 60) * precioKwhHora
      : duracion * precioKwhMinuto;
    const costoFilamentoUnitario    = filamento * (precioFilamentoKg / 1000);
    // El subtotal de fabricación incluye empaque y personalización (igual que la hoja de cálculo
    // original del negocio), para que imprevistos y ganancia se apliquen también sobre esos costos.
    const costoFabricacionUnitario  = costoEnergiaUnitario + costoFilamentoUnitario + costoDiseno + costoAccesorios + costoProcesado + valorEmpaque + valorPersonalizacion;

    const valorImprevistos          = costoFabricacionUnitario * (imprevistos / 100);
    const baseConImprevistos        = costoFabricacionUnitario + valorImprevistos;
    const gananciaUnitaria          = baseConImprevistos * (ganancia / 100);

    const precioUnitario            = costoFabricacionUnitario + gananciaUnitaria;
    const precioTotalUnitario       = precioUnitario;

    const subtotalEnergia           = costoEnergiaUnitario * unidades;
    const subtotalMaterial          = costoFilamentoUnitario * unidades;
    const subtotalFabricacionTotal  = costoFabricacionUnitario * unidades;
    const gananciaTotal             = gananciaUnitaria * unidades;
    const precioTotalProducto       = precioTotalUnitario * unidades;

    return {
      tiempoHoras, tiempoMinutos, duracion, filamento, costoDiseno, costoAccesorios,
      valorEmpaque, valorPersonalizacion, ganancia,
      horasProcesado, costoProcesado, imprevistos, valorImprevistos,
      precioKwhMinuto,
      costoEnergiaUnitario,
      costoFilamentoUnitario,
      costoFabricacionUnitario,
      precioUnitario,
      precioConGananciaUnitario: precioUnitario,
      precioTotalUnitario,
      subtotalEnergia,
      subtotalMaterial,
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

  // Recalcula todos los campos de precio de un producto de la cotización a partir de calcProduct
  const mapProductoConCalculo = (p: any, idx: number) => {
    const c = calcProduct(idx, p.unidades);
    return {
      ...p,
      idProducto: p.idProducto || p.ID_Producto || `PROD-${String(idx + 1).padStart(3, '0')}`,
      descripcionLineal: p.descripcionLineal || p.Descripcion_Lineal || p.nombre,
      tiempoHoras: c.tiempoHoras,
      tiempoMinutos: c.tiempoMinutos,
      pesoGramos: c.filamento,
      costoDisenoUnitario: c.costoDiseno,
      costoAccesoriosUnitario: c.costoAccesorios,
      duracionImpresionUnidad: c.duracion,
      filamentoUsadoUnidad: c.filamento,
      valorEmpaqueUnitario: c.valorEmpaque,
      valorPersonalizacionUnitario: c.valorPersonalizacion,
      horasPostProcesado: c.horasProcesado,
      costoProcesado: c.costoProcesado,
      porcentajeImprevistos: c.imprevistos,
      valorImprevistos: Math.round(c.valorImprevistos * 100) / 100,
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
      subtotalEnergia: Math.round(c.subtotalEnergia * 100) / 100,
      subtotalMaterial: Math.round(c.subtotalMaterial * 100) / 100,
      precioLinealTotal: Math.round(c.precioTotalProducto * 100) / 100,
      ID_Producto: p.idProducto || p.ID_Producto || `PROD-${String(idx + 1).padStart(3, '0')}`,
      Descripcion_Lineal: p.descripcionLineal || p.Descripcion_Lineal || p.nombre,
      Tiempo_Horas: Math.round(c.tiempoHoras * 100) / 100,
      Tiempo_Minutos: Math.round(c.tiempoMinutos * 100) / 100,
      Peso_Gramos: Math.round(c.filamento * 100) / 100,
      Cantidad_Piezas: p.unidades,
      'Costo_Diseño': Math.round(c.costoDiseno * 100) / 100,
      Costo_Accesorios: Math.round(c.costoAccesorios * 100) / 100,
      Costo_Personalizado: Math.round(c.valorPersonalizacion * 100) / 100,
      Costo_Empaque: Math.round(c.valorEmpaque * 100) / 100,
      Subtotal_Energia: Math.round(c.subtotalEnergia * 100) / 100,
      Subtotal_Material: Math.round(c.subtotalMaterial * 100) / 100,
      Subtotal_Fabricacion: Math.round(c.subtotalFabricacionTotal * 100) / 100,
      Precio_Unitario_Con_Ganancia: Math.round(c.precioUnitario * 100) / 100,
      Precio_Lineal_Total: Math.round(c.precioTotalProducto * 100) / 100,
    };
  };

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
        const initTrab: Record<number, Array<{ tempId: string; descripcion: string; valor: number; colaboradorUid: string }>> = {};
        selectedQuote.productos.forEach((_: any, idx: number) => { init[idx] = ''; initTrab[idx] = []; });
        setPerItemAssignments(init);
        setPerItemTrabajos(initTrab);
        setShowAssignDialog(true);
      } catch { /* si falla carga, proceder sin asignación */ }
      return;
    }

    setSaving(true);
    try {
      const updatedProductos = selectedQuote.productos.map(mapProductoConCalculo);

      const { subtotalFabricacion, ganancia, total } = getQuoteTotals();

      const updatedQuote = await actualizarQuote(token, selectedQuote.id, {
        productos: updatedProductos,
        estado: newStatus,
        ...(subEstado ? { subEstado } : {}),
        precioKwhHora,
        precioFilamentoKg,
        subtotalFabricacionTotal: Math.round(subtotalFabricacion * 100) / 100,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        porcentajeGanancia: updatedProductos.length > 0
          ? Math.round((updatedProductos.reduce((acc: number, p: any) => acc + (p.porcentajeGanancia || 0), 0) / updatedProductos.length) * 100) / 100
          : 30,
        notasCotizacion: selectedQuote.notasCotizacion || selectedQuote.Notas_Cotizacion || '',
        Subtotal_Fabricacion_Total: Math.round(subtotalFabricacion * 100) / 100,
        Valor_Ganancia_Total: Math.round(ganancia * 100) / 100,
        Precio_Total: Math.round(total * 100) / 100,
        Precio_Total_Cotizacion: Math.round(total * 100) / 100,
        Cantidad_Total_Piezas: updatedProductos.reduce((acc: number, p: any) => acc + (p.unidades || 0), 0),
        Notas_Cotizacion: selectedQuote.notasCotizacion || selectedQuote.Notas_Cotizacion || '',
      });
      setSelectedQuote(updatedQuote);
      setQuotesList(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Cambia el sub-estado de una cotización que ya está en estado "compra".
  // Reenvía los campos que la cotización ya tiene guardados (sin pasar por la
  // calculadora, que es exclusiva de la pestaña Cotizaciones).
  const handleUpdateSubEstado = async (quote: any, newSubEstado: string) => {
    if (!token) return;
    try {
      const updatedQuote = await actualizarQuote(token, quote.id, {
        productos: quote.productos,
        estado: quote.estado,
        subEstado: newSubEstado,
        precioKwhHora: quote.precioKwhHora,
        precioFilamentoKg: quote.precioFilamentoKg,
        subtotalFabricacionTotal: quote.subtotalFabricacionTotal,
        valorGananciaTotal: quote.valorGananciaTotal,
        precioTotalCotizacion: quote.precioTotalCotizacion,
        porcentajeGanancia: quote.porcentajeGanancia,
        notasCotizacion: quote.notasCotizacion || quote.Notas_Cotizacion || '',
      });
      setQuotesList(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
      if (selectedQuote?.id === updatedQuote.id) setSelectedQuote(updatedQuote);
    } catch (err: any) {
      alert('Error al actualizar el sub-estado: ' + err.message);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedQuote || !token) return;
    setAssignSaving(true);
    try {
      const colsDisponibles = assignColaboradores;
      const itemsPorColaborador = new Map<string, ReportItem[]>();

      // Build assignments: either all to one, or per item
      for (let idx = 0; idx < selectedQuote.productos.length; idx++) {
        const rawUid = assignMode === 'all' ? assignAllUid : (perItemAssignments[idx] || '');
        const uid = rawUid || '__sin_asignar__';
        const p = selectedQuote.productos[idx];
        const c = calcProduct(idx, p.unidades);
        const col = colsDisponibles.find(x => x.uid === uid);
        const item: ReportItem = {
          categoria: p.categoria || 'cotización-web',
          descripcion: p.descripcionLineal || p.Descripcion_Lineal || p.nombre || 'Producto',
          cantidad: p.unidades || 1,
          valor: c.precioTotalProducto,
          actividad: 'Cotización web aceptada',
          clienteNombre: selectedQuote.cliente?.nombre || '',
          clienteTelefono: selectedQuote.cliente?.telefono || '',
          origen: 'web',
          productoDetalle: {
            nombre: p.nombre,
            pesoGramos: c.filamento,
            tiempoHoras: c.tiempoHoras,
            tiempoMinutos: c.tiempoMinutos,
            costoDiseno: c.costoDiseno,
            costoAccesorios: c.costoAccesorios,
            costoEmpaque: c.valorEmpaque,
            costoPersonalizacion: c.valorPersonalizacion,
            filamentoUsado: c.filamento,
            valorUnitario: c.precioTotalUnitario,
          },
        };
        if (!itemsPorColaborador.has(uid)) itemsPorColaborador.set(uid, []);
        itemsPorColaborador.get(uid)!.push(item);

        // Trabajos (sub-items) for this product
        const trabajos = perItemTrabajos[idx] || [];
        for (const t of trabajos) {
          if (!t.colaboradorUid || !t.descripcion.trim() || t.valor <= 0) continue;
          const trabajoItem: ReportItem = {
            categoria: p.categoria || 'cotización-web',
            descripcion: `${p.descripcionLineal || p.Descripcion_Lineal || p.nombre || 'Producto'} - ${t.descripcion}`,
            cantidad: 1,
            valor: t.valor,
            actividad: t.descripcion,
            clienteNombre: selectedQuote.cliente?.nombre || '',
            clienteTelefono: selectedQuote.cliente?.telefono || '',
            origen: 'web',
          };
          if (!itemsPorColaborador.has(t.colaboradorUid)) itemsPorColaborador.set(t.colaboradorUid, []);
          itemsPorColaborador.get(t.colaboradorUid)!.push(trabajoItem);
        }
      }

      // Save quote as aceptado
      const updatedProductos = selectedQuote.productos.map(mapProductoConCalculo);

      const { subtotalFabricacion, ganancia, total } = getQuoteTotals();

      const updatedQuote = await actualizarQuote(token, selectedQuote.id, {
        productos: updatedProductos,
        estado: 'aceptado',
        subEstado: 'diseñando',
        precioKwhHora,
        precioFilamentoKg,
        subtotalFabricacionTotal: Math.round(subtotalFabricacion * 100) / 100,
        valorGananciaTotal: Math.round(ganancia * 100) / 100,
        precioTotalCotizacion: Math.round(total * 100) / 100,
        porcentajeGanancia: updatedProductos.length > 0
          ? Math.round((updatedProductos.reduce((acc: number, p: any) => acc + (p.porcentajeGanancia || 0), 0) / updatedProductos.length) * 100) / 100
          : 30,
        notasCotizacion: selectedQuote.notasCotizacion || selectedQuote.Notas_Cotizacion || '',
        Subtotal_Fabricacion_Total: Math.round(subtotalFabricacion * 100) / 100,
        Valor_Ganancia_Total: Math.round(ganancia * 100) / 100,
        Precio_Total: Math.round(total * 100) / 100,
        Precio_Total_Cotizacion: Math.round(total * 100) / 100,
        Cantidad_Total_Piezas: updatedProductos.reduce((acc: number, p: any) => acc + (p.unidades || 0), 0),
        Notas_Cotizacion: selectedQuote.notasCotizacion || selectedQuote.Notas_Cotizacion || '',
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
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setAssignSaving(false);
    }
  };

  const fetchImageDataUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      return await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No se puede acceder al canvas.'));
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
        img.src = imageUrl;
      });
    } catch {
      return null;
    }
  };

  const formatQuoteDate = (isoDate?: string) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleGeneratePdfAndOpenWhatsApp = async () => {
    if (!selectedQuote) return;

    const totals = getQuoteTotals();
    const cliente = selectedQuote.cliente || {};
    const clienteNombre = cliente.nombre || 'Cliente';
    const clienteCedula = cliente.cedula || 'No disponible';
    const clienteTelefono = String(cliente.telefono || '').replace(/[^0-9]/g, '');

    if (!clienteTelefono) {
      alert('El teléfono del cliente no es válido para WhatsApp. Verifica el número en la cotización.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 40;

    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 595, 120, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('Impresiones 3D', margin, y + 20);
    doc.setFontSize(11);
    doc.setTextColor(229, 231, 235);
    doc.text('Cotización de fabricación 3D', margin, y + 38);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.line(margin, y + 48, 555, y + 48);

    const imageFields = ['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal', 'imagenUrl'];
    const firstProductWithImg = selectedQuote.productos?.find((p: any) => imageFields.some(f => p[f]));
    const quoteImageUrl = firstProductWithImg ? imageFields.reduce<string | undefined>((url, f) => url || firstProductWithImg[f], undefined) : undefined;
    if (quoteImageUrl) {
      const imageDataUrl = await fetchImageDataUrl(quoteImageUrl);
      if (imageDataUrl) {
        try {
          doc.addImage(imageDataUrl, 'JPEG', 420, 20, 150, 90);
        } catch {
          doc.setFillColor(15, 118, 255);
          doc.rect(420, 20, 150, 90, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.text('Imagen', 435, 65);
          doc.text('de cotización', 435, 80);
        }
      }
    } else {
      doc.setFillColor(15, 118, 255);
      doc.rect(420, 20, 150, 90, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Imagen', 435, 65);
      doc.text('de cotización', 435, 80);
    }

    y += 80;
    doc.setTextColor(13, 42, 56);
    doc.setFontSize(10);
    doc.text(`Referencia: ${selectedQuote.id}`, margin, y + 14);
    doc.text(`Fecha: ${formatQuoteDate(selectedQuote.Fecha || selectedQuote.creadoEn || '')}`, margin + 250, y + 14);
    doc.text(`Cédula: ${clienteCedula}`, margin, y + 32);
    doc.text(`Teléfono: ${selectedQuote.cliente?.telefono || 'No disponible'}`, margin + 250, y + 32);
    doc.text(`Email: ${selectedQuote.cliente?.email || 'No disponible'}`, margin, y + 50);

    const totalPersonalizacion = selectedQuote.productos?.reduce(
      (acc: number, p: any) => acc + (p.precioPersonalizacion || p.Precio_Personalizacion || 0),
      0,
    ) || 0;
    const totalEmpaque = selectedQuote.productos?.reduce(
      (acc: number, p: any) => acc + (p.precioEmpaque || p.Precio_Empaque || 0),
      0,
    ) || 0;

    y += 70;
    doc.setFillColor(14, 165, 233);
    doc.rect(margin, y, 515, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Resumen de la cotización', margin + 8, y + 13);

    y += 35;
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text(`Subtotal fabricación: ${formatCOP(totals.subtotalFabricacion)}`, margin, y);
    doc.text(`Personalización: ${formatCOP(totalPersonalizacion)}`, margin + 280, y);
    y += 18;
    doc.text(`Empaque: ${formatCOP(totalEmpaque)}`, margin, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Total cotización: ${formatCOP(totals.total)}`, margin, y);

    y += 28;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Productos cotizados', margin, y);
    y += 18;

    selectedQuote.productos.forEach((p: any, idx: number) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      const nombreProducto = p.nombre || p.descripcionLineal || `Producto ${idx + 1}`;
      const precioUnitario = p.precioUnitario || p.Precio_Unitario || 0;
      const precioPintura = p.precioPintura || p.Precio_Pintura || 0;
      const precioPersonalizacion = p.precioPersonalizacion || p.Precio_Personalizacion || 0;
      const precioEmpaque = p.precioEmpaque || p.Precio_Empaque || 0;
      const unidades = p.unidades || 0;
      const totalProducto = p.precioTotal || p.Precio_Total || 0;

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`${idx + 1}. ${nombreProducto}`, margin, y);
      y += 12;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Cantidad: ${unidades}`, margin, y);
      y += 10;
      doc.text(`Precio unitario: ${formatCOP(precioUnitario)}`, margin, y);
      y += 10;
      doc.text(`Pintura + Personalización: ${formatCOP(precioPintura + precioPersonalizacion)}`, margin, y);
      y += 10;
      doc.text(`Empaque: ${formatCOP(precioEmpaque)}`, margin, y);
      y += 10;
      doc.text(`Total por producto: ${formatCOP(totalProducto)}`, margin, y);
      y += 14;
    });

    const filename = `cotizacion-${selectedQuote.id}.pdf`;
    doc.save(filename);

    const message = `Hola ${clienteNombre}, te envío la cotización final. Cédula: ${clienteCedula}. Total: ${formatCOP(totals.total)}. Referencia: ${selectedQuote.id}.`;
    const waUrl = `https://wa.me/${clienteTelefono}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
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
          {profile?.rol === 'administrador' && (
            <button
              onClick={() => { setActiveTab('precios'); setError(null); }}
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'precios'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Precios
            </button>
          )}
          {profile?.rol === 'administrador' && (
            <button
              onClick={() => { setActiveTab('compras'); setError(null); }}
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
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
              className="py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer border-transparent text-slate-400 hover:text-slate-200"
            >
              <BarChart3 className="w-4 h-4" />
              Reportes
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
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: USUARIOS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'usuarios' && (
            <UsersTab
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
            <ComprasTab quotesList={quotesList} handleUpdateSubEstado={handleUpdateSubEstado} />
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
