import React, { useState } from 'react';
import { Calculator, DollarSign, ArrowRight, Percent } from 'lucide-react';

export const CalculatorView: React.FC = () => {
  const [sales, setSales] = useState<string>('');
  const [purchases, setPurchases] = useState<string>('');

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
    const rawValue = parseNumber(e.target.value);
    setSales(rawValue === 0 ? '' : formatCurrency(rawValue));
  };

  const handlePurchasesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseNumber(e.target.value);
    setPurchases(rawValue === 0 ? '' : formatCurrency(rawValue));
  };

  const salesAmount = parseNumber(sales);
  const purchasesAmount = parseNumber(purchases);

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

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Calculadora Tributaria</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Cálculo de IVA referencial</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
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
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none text-slate-900">
              <Percent size={200} />
            </div>
            
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Calculator size={16} className="text-indigo-600" /> Resultados del Período
            </h2>

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Neto (Ventas)</span>
                  <span className="text-xl font-black text-slate-800">{formatCurrency(netoVentas)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IVA Débito</span>
                  <span className="text-xl font-black text-indigo-600">{formatCurrency(ivaDebito)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Neto (Compras)</span>
                  <span className="text-xl font-black text-slate-800">{formatCurrency(netoCompras)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IVA Recuperable</span>
                  <span className="text-xl font-black text-emerald-600">{formatCurrency(ivaCredito)}</span>
                </div>
              </div>

              <div className={`mt-8 p-6 rounded-2xl border ${isPositive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-950' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-950'}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isPositive ? 'text-indigo-700' : 'text-emerald-700'}`}>
                  {isPositive ? 'IVA a Pagar' : 'Remanente a Favor'}
                </span>
                <div className="flex flex-col gap-4">
                  <span className={`text-4xl font-black tracking-tighter ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>
                    {formatCurrency(absoluteIva)}
                  </span>
                  
                  {absoluteIva > 0 && (
                    <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isPositive ? 'border-indigo-500/20' : 'border-emerald-500/20'}`}>
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isPositive ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>Monto Neto Referencial</span>
                        <span className={`text-base font-black ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>{formatCurrency(netoCorrespondiente)}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isPositive ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>Total Bruto Referencial</span>
                        <span className={`text-base font-black ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>{formatCurrency(brutoCorrespondiente)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
