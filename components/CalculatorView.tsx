import React, { useState } from 'react';
import { Calculator, DollarSign } from 'lucide-react';

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

  // Cálculos para la simulación de objetivos
  const neededSalesGross = targetIvaAmount > ivaToPay
    ? Math.round((targetIvaAmount - ivaToPay) / 0.19) + (targetIvaAmount - ivaToPay)
    : 0;
  const neededPurchasesGross = targetIvaAmount < ivaToPay
    ? Math.round((ivaToPay - targetIvaAmount) / 0.19) + (ivaToPay - targetIvaAmount)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex flex-col items-center animate-in fade-in duration-500">
      <div className="w-full max-w-[820px] mx-auto space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Calculator size={22} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Calculadora Tributaria</h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Cálculo de IVA referencial</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white p-6 md:p-7 rounded-[1.75rem] shadow-xl border border-slate-100 space-y-6 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={15} className="text-indigo-600" /> Ingreso de Valores (Total Bruto)
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Compras (Bruto)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="text"
                    value={purchases}
                    onChange={handlePurchasesChange}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Ventas (Bruto)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="text"
                    value={sales}
                    onChange={handleSalesChange}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 space-y-4 relative z-10 flex-1">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <Calculator size={13} className="text-slate-400" /> Resultados del Período
                </h3>

                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Neto Compras</span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(netoCompras)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">IVA Recuperable</span>
                    <span className="text-base font-black text-emerald-600">{formatCurrency(ivaCredito)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Neto Ventas</span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(netoVentas)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">IVA Débito</span>
                    <span className="text-base font-black text-indigo-600">{formatCurrency(ivaDebito)}</span>
                  </div>
                </div>

                <div className={`mt-4 p-4 rounded-xl border ${isPositive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-950' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-950'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${isPositive ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    {isPositive ? 'IVA a Pagar' : 'Remanente a Favor'}
                  </span>
                  <div className="flex flex-col gap-2">
                    <span className={`text-2xl font-black tracking-tighter ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>
                      {isPositive ? formatCurrency(absoluteIva) : `-${formatCurrency(absoluteIva)}`}
                    </span>
                    
                    {absoluteIva > 0 && (
                      <div className={`grid grid-cols-2 gap-2 pt-2.5 border-t ${isPositive ? 'border-indigo-500/20' : 'border-emerald-500/20'}`}>
                        <div className="flex flex-col">
                          <span className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${isPositive ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>Neto Ref.</span>
                          <span className={`text-xs font-black ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>{formatCurrency(netoCorrespondiente)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${isPositive ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>Bruto Ref.</span>
                          <span className={`text-xs font-black ${isPositive ? 'text-indigo-900' : 'text-emerald-900'}`}>{formatCurrency(brutoCorrespondiente)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mt-4">
                  <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Tasa PPM (%)
                    </label>
                    <div className="relative w-20">
                      <input
                        type="text"
                        value={ppm}
                        onChange={handlePpmChange}
                        placeholder="0.25"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Monto PPM</span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(ppmAmount)}</span>
                  </div>
                </div>

                <div className={`mt-4 p-4 rounded-xl shadow-lg border ${isPositive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-emerald-600 text-white border-emerald-500'}`}>
                  <span className={`text-[8px] font-black uppercase tracking-widest mb-1 block opacity-80`}>
                    {isPositive ? 'Total a Pagar (IVA + PPM)' : 'Total a Pagar (Solo PPM)'}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-2xl font-black tracking-tighter`}>
                      {formatCurrency(totalResult)}
                    </span>
                  </div>
                </div>
              </div>
          </div>

          <div className="bg-white p-6 md:p-7 rounded-[1.75rem] shadow-xl border border-slate-100 space-y-6 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none text-slate-900">
              <Calculator size={200} />
            </div>
            
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Calculator size={15} className="text-indigo-600" /> Simulador de Objetivos
            </h2>

            <div className="space-y-5 relative z-10 flex-1 flex flex-col">
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Ingresa el monto de IVA que desea pagar el cliente para calcular cuánto más necesitas comprar o vender.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  IVA Deseado a Pagar
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="text"
                    value={targetIva}
                    onChange={handleTargetIvaChange}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black placeholder:text-slate-300"
                  />
                </div>
              </div>

              {targetIva !== '' && (
                <div className="pt-1">
                  <div id="simulador-accion-requerida" className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800 space-y-3">
                    <div className="space-y-2 pb-3 border-b border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Compras:</span>
                        <span className="text-xs font-black text-slate-800">{formatCurrency(purchasesAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Ventas:</span>
                        <span className="text-xs font-black text-slate-800">{formatCurrency(salesAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total a Pagar:</span>
                        <span className={`text-xs font-black ${isPositive ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {formatCurrency(totalResult)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Acción Requerida
                    </h3>
                    {targetIvaAmount > ivaToPay ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-600">Para alcanzar este IVA, necesitas <span className="text-indigo-600 font-black">Vender más</span>:</span>
                        <div className="flex justify-between items-end mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ventas Adic. (Bruto)</span>
                          <span className="text-xl font-black text-indigo-600">
                            {formatCurrency(neededSalesGross)}
                          </span>
                        </div>
                      </div>
                    ) : targetIvaAmount < ivaToPay ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-600">Para alcanzar este IVA, necesitas <span className="text-emerald-600 font-black">Comprar más</span>:</span>
                        <div className="flex justify-between items-end mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compras Adic. (Bruto)</span>
                          <span className="text-xl font-black text-emerald-600">
                            {formatCurrency(neededPurchasesGross)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-emerald-700">El IVA actual ya coincide con el objetivo deseado.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(salesAmount > 0 || purchasesAmount > 0) && (
                <div className={`mt-auto p-4 rounded-xl border ${isPositive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-950' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-950'}`}>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isPositive ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    Recomendación Estratégica
                  </h3>
                  <p className="text-xs font-medium leading-relaxed">
                    {isPositive 
                      ? "El período indica un IVA a pagar. Si el débito es muy alto, realizar Compras."
                      : "El período indica un REMANENTE a favor. Si el crédito es muy alto, realizar Ventas."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
