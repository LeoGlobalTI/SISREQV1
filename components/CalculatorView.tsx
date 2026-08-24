import React, { useState } from 'react';
import { Calculator, DollarSign, ArrowRight, Percent, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const CalculatorView: React.FC = () => {
  const [sales, setSales] = useState<string>('');
  const [purchases, setPurchases] = useState<string>('');
  const [targetIva, setTargetIva] = useState<string>('');
  const [ppm, setPpm] = useState<string>('0.25');

  const parseNumber = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = e.target.value.replace(/\D/g, '');
    if (parsed === '') {
      setSales('');
      return;
    }
    const rawValue = parseInt(parsed, 10);
    setSales(formatCurrency(rawValue));
  };

  const handlePurchasesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = e.target.value.replace(/\D/g, '');
    if (parsed === '') {
      setPurchases('');
      return;
    }
    const rawValue = parseInt(parsed, 10);
    setPurchases(formatCurrency(rawValue));
  };

  const handleTargetIvaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = e.target.value.replace(/\D/g, '');
    if (parsed === '') {
      setTargetIva('');
      return;
    }
    const rawValue = parseInt(parsed, 10);
    setTargetIva(formatCurrency(rawValue));
  };

  const handlePpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    // limit multiple dots
    const dots = val.match(/\./g);
    if (dots && dots.length > 1) {
      val = val.substring(0, val.lastIndexOf('.'));
    }
    setPpm(val);
  };

  const salesAmount = parseNumber(sales);
  const purchasesAmount = parseNumber(purchases);
  const targetIvaAmount = parseNumber(targetIva);
  const ppmValue = parseFloat(ppm) || 0;

  // Consideramos que los montos ingresados son BRUTOS (Total).
  // IVA es 19% en Chile
  const netoVentas = Math.round(salesAmount / 1.19);
  const ivaDebito = salesAmount - netoVentas;

  const netoCompras = Math.round(purchasesAmount / 1.19);
  const ivaCredito = purchasesAmount - netoCompras; // IVA Recuperable
  
  const ivaToPay = ivaDebito - ivaCredito;
  const isPositive = ivaToPay >= 0;

  const absoluteIva = Math.abs(ivaToPay);
  const netoCorrespondiente = absoluteIva > 0 ? Math.round(absoluteIva / 0.19) : 0;
  const brutoCorrespondiente = netoCorrespondiente + absoluteIva;

  const ppmAmount = Math.round(netoVentas * (ppmValue / 100));
  const totalResult = isPositive ? (absoluteIva + ppmAmount) : ppmAmount;

  const chartData = [
    { name: 'IVA Débito (Ventas)', amount: ivaDebito, color: '#4f46e5' }, // indigo-600
    { name: 'IVA Crédito (Compras)', amount: ivaCredito, color: '#059669' }, // emerald-600
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 animate-in fade-in duration-500">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Calculadora Tributaria</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Cálculo de IVA referencial</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={16} className="text-indigo-600" /> Ingreso de Valores (Total Bruto)
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Ventas (Bruto)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="text"
                    value={sales}
                    onChange={handleSalesChange}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Compras (Bruto)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="text"
                    value={purchases}
                    onChange={handlePurchasesChange}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 space-y-6 relative z-10 flex-1">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Calculator size={14} className="text-slate-400" /> Resultados del Período
                </h3>

                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Neto (Ventas)</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(netoVentas)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IVA Débito</span>
                    <span className="text-lg font-black text-indigo-600">{formatCurrency(ivaDebito)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Neto (Compras)</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(netoCompras)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IVA Recuperable</span>
                    <span className="text-lg font-black text-emerald-600">{formatCurrency(ivaCredito)}</span>
                  </div>
                </div>

                <div className={`mt-6 p-5 rounded-2xl border ${isPositive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-950' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-950'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${isPositive ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    {isPositive ? 'IVA a Pagar' : 'Remanente a Favor'}
                  </span>
                  <div className="flex flex-col gap-3">
                    <span className={`text-3xl font-black tracking-tighter ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>
                      {isPositive ? formatCurrency(absoluteIva) : `-${formatCurrency(absoluteIva)}`}
                    </span>
                    
                    {absoluteIva > 0 && (
                      <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${isPositive ? 'border-indigo-500/20' : 'border-emerald-500/20'}`}>
                        <div className="flex flex-col">
                          <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${isPositive ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>Neto Referencial</span>
                          <span className={`text-sm font-black ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>{formatCurrency(netoCorrespondiente)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${isPositive ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>Bruto Referencial</span>
                          <span className={`text-sm font-black ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>{formatCurrency(brutoCorrespondiente)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mt-6">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Tasa PPM (%)
                    </label>
                    <div className="relative w-24">
                      <input
                        type="text"
                        value={ppm}
                        onChange={handlePpmChange}
                        placeholder="0.25"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto PPM</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(ppmAmount)}</span>
                  </div>
                </div>

                <div className={`mt-6 p-5 rounded-2xl shadow-lg border ${isPositive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-emerald-600 text-white border-emerald-500'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-1 block opacity-80`}>
                    {isPositive ? 'Total a Pagar (IVA + PPM)' : 'Total a Pagar (Solo PPM)'}
                  </span>
                  <div className="flex flex-col gap-3">
                    <span className={`text-3xl font-black tracking-tighter`}>
                      {formatCurrency(totalResult)}
                    </span>
                  </div>
                </div>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
              <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none text-slate-900">
                <Calculator size={200} />
              </div>
              
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Calculator size={16} className="text-indigo-600" /> Simulador de Objetivos
              </h2>

              <div className="space-y-6 relative z-10 flex-1 flex flex-col">
                <p className="text-xs font-bold text-slate-500">
                  Ingresa el monto de IVA que deseas pagar (o mantener como remanente) para calcular cuánto más necesitas vender o comprar.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    IVA Deseado a Pagar
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="text"
                      value={targetIva}
                      onChange={handleTargetIvaChange}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {targetIva !== '' && targetIvaAmount !== ivaToPay && (
                  <div className="mt-auto pt-6">
                    <div className="p-6 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800">
                      <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-500">
                        Acción Requerida
                      </h3>
                      {targetIvaAmount > ivaToPay ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-bold text-slate-600">Para alcanzar este IVA a Pagar, necesitas <span className="text-indigo-600">Vender más</span>:</span>
                          <div className="flex justify-between items-end mt-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas Adicionales (Bruto)</span>
                            <span className="text-2xl font-black text-indigo-600">
                              {formatCurrency(Math.round((targetIvaAmount - ivaToPay) / 0.19) + (targetIvaAmount - ivaToPay))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-bold text-slate-600">Para alcanzar este IVA a Pagar, necesitas <span className="text-emerald-600">Comprar más</span>:</span>
                          <div className="flex justify-between items-end mt-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compras Adicionales (Bruto)</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {formatCurrency(Math.round((ivaToPay - targetIvaAmount) / 0.19) + (ivaToPay - targetIvaAmount))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
        
        {/* Third Box for Chart and Advice */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden flex flex-col">
             <div className={`absolute top-0 left-0 w-full h-2 ${isPositive ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
             <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <PieChart size={16} className={isPositive ? 'text-indigo-600' : 'text-emerald-600'} /> Gráfico y Análisis
            </h2>

            {salesAmount === 0 && purchasesAmount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60 flex-1 py-12">
                <PieChart size={64} className="text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400 text-center max-w-[200px]">
                  Ingresa los montos para visualizar el gráfico y las recomendaciones
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 flex-1 justify-between">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {
                          chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`p-8 rounded-2xl border ${isPositive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-950' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-950'}`}>
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${isPositive ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    Recomendación Estratégica
                  </h3>
                  <p className="text-lg font-medium leading-relaxed">
                    {isPositive 
                      ? "El período indica un IVA a pagar. Si el debito es muy alto, realice compras."
                      : "El período indica un IVA a favor. Se debe realizar mayores compras."}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
