import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LabelList
} from 'recharts';
import { 
  FileText, 
  TrendingUp, 
  Filter, 
  Calendar, 
  Target, 
  Upload,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parse, isValid, getMonth, getYear } from 'date-fns';
import { SettlementRecord, MonthlyTarget } from './types';
import { cn } from './lib/utils';

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#facc15', // Yellow
  '#4ade80', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#a3e635', // Lime
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
  '#fbbf24', // Amber
  '#10b981', // Emerald
];
const STATUS_COLORS: Record<string, string> = {
  '1. 0.0.0 - On Hold': '#ef4444',
  '2. Data and Docs': '#f97316',
  '3. Negotiation': '#facc15',
  '4. Pre-Assessment': '#4ade80',
  '5. Pre-approved': '#3b82f6',
  '5 - Pre-Lodgement': '#8b5cf6',
  'Settled': '#10b981',
  'Pending': '#0ea5e9',
  'Settlement Booked': '#f43f5e',
  'MIRs': '#14b8a6',
  'Pre-Lodgement': '#a3e635',
  'Unconditionally Approved': '#d946ef',
};

const getStageColor = (name: string) => {
  const normalized = name.trim();
  if (STATUS_COLORS[normalized]) return STATUS_COLORS[normalized];
  
  // Case-insensitive lookup
  const foundKey = Object.keys(STATUS_COLORS).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  if (foundKey) return STATUS_COLORS[foundKey];

  // Consistent fallback based on string hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize="10" 
      fontWeight="bold"
      fontFamily="monospace"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const MultiSelect = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onChange: (val: string[]) => void; 
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col">
        <span className="text-[10px] font-mono uppercase opacity-50 mb-1">{label}:</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-[#001f3f]/20 rounded text-sm font-medium hover:border-[#001f3f] transition-colors min-w-[140px] max-w-[200px]"
        >
          <span className="truncate">
            {selected.length === 0 ? placeholder : 
             selected.length === 1 ? selected[0] : 
             `${selected.length} selected`}
          </span>
          <Plus size={14} className={cn("transition-transform", isOpen && "rotate-45")} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-[#001f3f] shadow-xl z-20 max-h-[300px] overflow-auto">
            <div 
              className="p-2 border-b border-[#f0f4f8] hover:bg-[#f8fafc] cursor-pointer flex items-center gap-2"
              onClick={() => {
                onChange([]);
                setIsOpen(false);
              }}
            >
              <div className={cn("w-3 h-3 border border-[#001f3f]", selected.length === 0 && "bg-[#001f3f]")} />
              <span className="text-xs font-medium">All {label}s</span>
            </div>
            {options.map(option => (
              <div 
                key={option}
                className="p-2 border-b border-[#f0f4f8] last:border-0 hover:bg-[#f8fafc] cursor-pointer flex items-center gap-2"
                onClick={() => toggleOption(option)}
              >
                <div className={cn("w-3 h-3 border border-[#001f3f]", selected.includes(option) && "bg-[#001f3f]")} />
                <span className="text-xs">{option}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<SettlementRecord[]>([
    {
      id: 'sample-1',
      date: new Date(),
      status: 'Settlement Booked',
      amount: 640000,
      description: 'Major Settlement A',
      lender: 'First National Bank'
    },
    {
      id: 'sample-2',
      date: new Date(),
      status: 'Settlement Booked',
      amount: 459900,
      description: 'Strategic Settlement B',
      lender: 'Global Credit Union'
    },
    {
      id: 'sample-3',
      date: new Date(),
      status: '1. 0.0.0 - On Hold',
      amount: 125000,
      description: 'Initial Prospect',
      lender: 'Westside Lending'
    },
    {
      id: 'sample-4',
      date: new Date(),
      status: '2. Data and Docs',
      amount: 85000,
      description: 'Follow-up Call',
      lender: 'East Coast Finance'
    },
    {
      id: 'sample-5',
      date: new Date(),
      status: '3. Negotiation',
      amount: 320000,
      description: 'Contract Review',
      lender: 'Midwest Capital'
    },
    {
      id: 'sample-6',
      date: new Date(),
      status: '4. Pre-Assessment',
      amount: 150000,
      description: 'Legal Processing',
      lender: 'Southwest Trust'
    },
    {
      id: 'sample-7',
      date: new Date(),
      status: '5. Pre-approved',
      amount: 210000,
      description: 'Awaiting Signature',
      lender: 'Northern Bank'
    },
    {
      id: 'sample-8',
      date: new Date(),
      status: 'Settled',
      amount: 500000,
      description: 'Completed Project',
      lender: 'Pacific Equity'
    }
  ]);
  const [targets, setTargets] = useState<MonthlyTarget[]>(() => {
    const saved = localStorage.getItem('settlement_targets');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(-1);
  const [selectedYear, setSelectedYear] = useState<number>(-1);
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempStageTargets, setTempStageTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('settlement_targets', JSON.stringify(targets));
  }, [targets]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const parsedData: SettlementRecord[] = data.map((row: any, index: number) => {
        const dateStr = String(row.Date || row.date || row.DATE || '');
        const rawStatus = String(row.Stage || row.stage || row.STAGE || row.Status || row.status || row.STATUS || 'Unknown').trim();
        
        // Normalize status to match STATUS_COLORS keys if possible (case-insensitive)
        const status = Object.keys(STATUS_COLORS).find(
          key => key.toLowerCase() === rawStatus.toLowerCase()
        ) || rawStatus;

        const amountValue = row.Amount || row.amount || row.AMOUNT || row['Loan Amount'] || row['LOAN AMOUNT'] || row['loan amount'] || 0;
        const amountStr = String(amountValue);
        
        let date = new Date(dateStr);
        if (!isValid(date) && dateStr) {
          date = parse(dateStr, 'MM/dd/yyyy', new Date());
          if (!isValid(date)) date = parse(dateStr, 'yyyy-MM-dd', new Date());
        }

        return {
          id: index.toString(),
          date: isValid(date) ? date : new Date(),
          status: status.trim(),
          amount: typeof amountValue === 'number' ? amountValue : parseFloat(amountStr.replace(/[$,]/g, '')) || 0,
          description: String(row.Description || row.description || row.DESCRIPTION || ''),
          loanId: String(row.LoanID || row.loan_id || row.LOAN_ID || row.ID || row.id || ''),
          borrower: String(row.Borrower || row.borrower || row.BORROWER || row.Name || row.name || row.NAME || ''),
          lender: String(row.Lender || row.lender || row.LENDER || ''),
          category: String(row.Category || row.category || row.CATEGORY || '')
        };
      });
      setData(parsedData);
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = useMemo(() => {
    return data
      .filter(item => 
        (selectedMonth === -1 || getMonth(item.date) === selectedMonth) && 
        (selectedYear === -1 || getYear(item.date) === selectedYear) &&
        (selectedLenders.length === 0 || selectedLenders.includes(item.lender)) &&
        (selectedStages.length === 0 || selectedStages.includes(item.status))
      )
      .sort((a, b) => {
        const aNum = parseInt(a.status.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.status.match(/\d+/)?.[0] || '0');
        if (aNum !== bNum) return aNum - bNum;
        return a.status.localeCompare(b.status, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [data, selectedMonth, selectedYear, selectedLenders, selectedStages]);

  const currentTarget = useMemo(() => {
    const target = targets.find(t => t.month === selectedMonth && t.year === selectedYear);
    if (!target) return 0;
    
    if (selectedStages.length > 0) {
      return selectedStages.reduce((sum, stage) => sum + (target.stageTargets?.[stage] || 0), 0);
    }
    
    return target.value;
  }, [targets, selectedMonth, selectedYear, selectedStages]);

  const currentStageTargets = useMemo((): Record<string, number> => {
    const target = targets.find(t => t.month === selectedMonth && t.year === selectedYear);
    return target?.stageTargets || {};
  }, [targets, selectedMonth, selectedYear]);

  const statsByStatus = useMemo(() => {
    const stats: Record<string, { value: number; count: number }> = {};
    filteredData.forEach(item => {
      if (!stats[item.status]) {
        stats[item.status] = { value: 0, count: 0 };
      }
      stats[item.status].value += item.amount;
      stats[item.status].count += 1;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, value: data.value, count: data.count }))
      .sort((a, b) => {
        const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0');
        if (aNum !== bNum) return aNum - bNum;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [filteredData]);

  const totalValue = useMemo(() => 
    filteredData.reduce((sum, item) => sum + item.amount, 0), 
  [filteredData]);

  const toTarget = currentTarget - totalValue;

  const targetProgress = currentTarget > 0 ? (totalValue / currentTarget) * 100 : 0;

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const dataYears = data.map(d => getYear(d.date));
    const allYears = Array.from(new Set([current, ...dataYears])).sort((a, b) => b - a);
    return allYears;
  }, [data]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const lenders = useMemo(() => {
    const list = data.map(d => d.lender).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [data]);

  const stages = useMemo(() => {
    const list = data.map(d => d.status).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      if (aNum !== bNum) return aNum - bNum;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [data]);

  const calculatedOverallTarget = useMemo(() => {
    return Object.values(tempStageTargets).reduce((sum: number, val: string) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [tempStageTargets]);

  const handleSaveTarget = () => {
    const stageTargets: Record<string, number> = {};
    let totalSum = 0;
    Object.entries(tempStageTargets).forEach(([stage, amount]) => {
      const num = parseFloat(amount as string);
      if (!isNaN(num)) {
        stageTargets[stage] = num;
        totalSum += num;
      }
    });

    if (totalSum === 0 && Object.keys(tempStageTargets).length === 0) return;

    setTargets(prev => {
      const filtered = prev.filter(t => !(t.month === selectedMonth && t.year === selectedYear));
      return [...filtered, { 
        month: selectedMonth, 
        year: selectedYear, 
        value: totalSum,
        stageTargets 
      }];
    });
    setIsTargetModalOpen(false);
    setTempStageTargets({});
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-[#001f3f] font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#001f3f] flex items-center justify-center rounded">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest opacity-50">Settlement Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight">Performance Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center justify-center w-10 h-10 bg-white border border-[#001f3f] rounded cursor-pointer hover:bg-[#001f3f] hover:text-white transition-colors" title="Upload Excel Data">
            <Upload size={18} />
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          
          {data.length > 0 && (
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to clear all data?')) {
                  setData([]);
                }
              }}
              className="flex items-center justify-center w-10 h-10 bg-white border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors"
              title="Clear All Data"
            >
              <AlertCircle size={18} />
            </button>
          )}
          
          <button 
            onClick={() => {
              const initialStageTargets: Record<string, string> = {};
              stages.forEach(s => {
                initialStageTargets[s] = (currentStageTargets[s] || 0).toString();
              });
              setTempStageTargets(initialStageTargets);
              setIsTargetModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#001f3f] text-white rounded hover:opacity-90 transition-opacity"
          >
            <Target size={16} />
            <span className="text-sm font-medium">Set Target</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="bg-white border border-[#001f3f] p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Filter size={16} className="opacity-50" />
            <span className="text-xs font-mono uppercase tracking-wider">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar size={14} className="opacity-50" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none border-b border-transparent hover:border-[#001f3f] cursor-pointer"
            >
              <option value="-1">All Months</option>
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none border-b border-transparent hover:border-[#001f3f] cursor-pointer"
            >
              <option value="-1">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <MultiSelect 
            label="Lender"
            options={lenders}
            selected={selectedLenders}
            onChange={setSelectedLenders}
            placeholder="All Lenders"
          />

          <MultiSelect 
            label="Stage"
            options={stages}
            selected={selectedStages}
            onChange={setSelectedStages}
            placeholder="All Stages"
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Loan Amount" 
            value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign size={20} />}
          />
          <MetricCard 
            label="Monthly Target" 
            value={`$${currentTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Target size={20} />}
            subtext={`${targetProgress.toFixed(1)}% of goal`}
          />
          <MetricCard 
            label="Total Data Records" 
            value={data.length.toString()}
            icon={<FileText size={20} />}
            subtext={filteredData.length !== data.length ? `Showing ${filteredData.length} filtered` : "All records shown"}
          />
          <MetricCard 
            label="To Target" 
            value={`$${toTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<CheckCircle2 size={20} />}
            subtext={toTarget <= 0 ? "Target Achieved!" : "Remaining to goal"}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white border border-[#001f3f] p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-serif italic text-xl">Total Loan Summation per Stage ($)</h3>
                <p className="text-[10px] font-mono uppercase opacity-50 mt-1">
                  Total Pipeline: ${statsByStatus.reduce((sum, s) => sum + s.value, 0).toLocaleString()}
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase opacity-50">Pipeline Analysis</span>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsByStatus} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontFamily: 'monospace', fill: '#001f3f' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontFamily: 'monospace', fill: '#001f3f' }}
                    tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ 
                      backgroundColor: '#001f3f', 
                      border: 'none', 
                      borderRadius: '0px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {statsByStatus.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={getStageColor(entry.name)} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      formatter={(val: number) => `$${val.toLocaleString()}`}
                      style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', fill: '#001f3f' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart / Summary */}
          <div className="bg-white border border-[#001f3f] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif italic text-xl">Stage Distribution</h3>
              <span className="text-[10px] font-mono uppercase opacity-50">Composition</span>
            </div>
            <div className="h-[350px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={140}
                    paddingAngle={0}
                    dataKey="count"
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {statsByStatus.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={getStageColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      const total = statsByStatus.reduce((sum, s) => sum + s.count, 0);
                      const percent = ((value / total) * 100).toFixed(0);
                      return [`${value} Loans (${percent}%)`, name];
                    }}
                    contentStyle={{ 
                      backgroundColor: '#001f3f', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1 overflow-auto pr-2">
              {statsByStatus.map((stat, idx) => {
                const stageTarget = currentStageTargets[stat.name] || 0;
                const progress = stageTarget > 0 ? (stat.value / stageTarget) * 100 : 0;
                
                return (
                  <div key={stat.name} className="flex flex-col p-2 border-b border-[#f0f4f8] last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getStageColor(stat.name) }} 
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{stat.name}</span>
                          <span className="text-[9px] opacity-50 font-mono uppercase tracking-tight">
                            ${stat.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold">{stat.count}</div>
                        <div className="text-[8px] opacity-40 uppercase font-mono tracking-tighter">Total Loans</div>
                      </div>
                    </div>
                    
                    {stageTarget > 0 && (
                      <div className="mt-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-mono opacity-40 uppercase">Target: ${stageTarget.toLocaleString()}</span>
                          <span className={cn(
                            "text-[8px] font-mono font-bold",
                            progress >= 100 ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              progress >= 100 ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {statsByStatus.length > 0 && (
                <div className="flex items-center justify-between p-2 mt-2 bg-[#f1f5f9] border-t border-[#001f3f]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">Total Summation</span>
                    <span className="text-[9px] opacity-50 font-mono">
                      ${totalValue.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold">{filteredData.length} Loans</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#001f3f] overflow-hidden">
          <div className="p-4 border-b border-[#001f3f] flex items-center justify-between bg-[#f8fafc]">
            <h3 className="font-serif italic text-lg">Detailed Records</h3>
            <span className="text-[10px] font-mono uppercase opacity-50">{filteredData.length} entries found</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#001f3f] bg-[#f1f5f9]">
                  <th className="p-4 text-[11px] font-mono uppercase tracking-wider opacity-50">Lender</th>
                  <th className="p-4 text-[11px] font-mono uppercase tracking-wider opacity-50">Stage</th>
                  <th className="p-4 text-[11px] font-mono uppercase tracking-wider opacity-50 text-center">No. of Loans</th>
                  <th className="p-4 text-[11px] font-mono uppercase tracking-wider opacity-50 text-right">Loan Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.lender || item.borrower || item.description || 'No Lender Info'}</span>
                          {item.loanId && <span className="text-[10px] font-mono opacity-50">ID: {item.loanId}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span 
                          className="text-[10px] font-bold uppercase px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `${getStageColor(item.status)}20`, 
                            color: getStageColor(item.status) 
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono text-center">1</td>
                      <td className="p-4 text-sm font-mono font-bold text-right">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <AlertCircle size={32} />
                        <p className="text-sm font-medium">No data available for this period. Please upload an Excel file or sync with Google Sheets.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="border-t-2 border-[#001f3f] bg-[#f1f5f9]">
                  <tr className="font-bold">
                    <td className="p-4 text-sm">Total</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-sm font-mono text-center">{filteredData.length}</td>
                    <td className="p-4 text-sm font-mono text-right">${filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>

        {/* Target Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-[#001f3f] p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,31,63,1)] max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-serif italic mb-6">Set Monthly Targets</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter targets for {months[selectedMonth]} {selectedYear}.
            </p>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Overall Target Amount ($) - Calculated Sum</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={calculatedOverallTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-[#001f3f] rounded bg-gray-50 font-mono text-lg cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">Automatically sums all stage targets below</p>
              </div>

              <div className="border-t border-[#001f3f]/10 pt-6">
                <h3 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-4">Targets Per Stage</h3>
                <div className="grid grid-cols-1 gap-4">
                  {stages.map(stage => (
                    <div key={stage} className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium">{stage}</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="number" 
                          value={tempStageTargets[stage] || ''}
                          onChange={(e) => setTempStageTargets(prev => ({ ...prev, [stage]: e.target.value }))}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 border border-[#001f3f]/20 rounded focus:outline-none focus:border-[#001f3f] font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 sticky bottom-0 bg-white pt-4">
              <button 
                onClick={() => setIsTargetModalOpen(false)}
                className="flex-1 px-4 py-3 border border-[#001f3f] rounded hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTarget}
                className="flex-1 px-4 py-3 bg-[#001f3f] text-white rounded hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Save Targets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#001f3f]/10 pb-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase opacity-40">© 2026 Settlement Intelligence Systems</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-[10px] font-mono uppercase opacity-40 hover:opacity-100 transition-opacity">Documentation</a>
          <a href="#" className="text-[10px] font-mono uppercase opacity-40 hover:opacity-100 transition-opacity">Export Report</a>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ label, value, icon, subtext }: { label: string; value: string; icon: React.ReactNode; subtext?: string }) {
  return (
    <div className="bg-white border border-[#001f3f] p-6 flex flex-col justify-between hover:shadow-md transition-shadow">

      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">{label}</span>
        <div className="opacity-30">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-mono font-bold tracking-tight">{value}</div>
        {subtext && (
          <div className="mt-1 text-[10px] font-mono text-emerald-600 font-bold">{subtext}</div>
        )}
      </div>
    </div>
  );
}
