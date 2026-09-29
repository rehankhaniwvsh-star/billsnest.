import React, { useState } from 'react';
import { InvoiceData, BrandSettings } from '../types';
import {
  X,
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  Mail,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Palette,
  Eye,
  Maximize2,
  Sparkles,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceData[];
  brand: BrandSettings;
  onSelectInvoice: (invoice: InvoiceData, openFullscreen?: boolean) => void;
  onCreateNewInvoice: () => void;
  onUpdateInvoiceStatus: (id: string, status: InvoiceData['status']) => void;
  onDeleteInvoice: (id: string) => void;
  onDuplicateInvoice: (invoice: InvoiceData) => void;
  onDownloadPdf: (invoice: InvoiceData) => void;
  onEmailInvoice: (invoice: InvoiceData) => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  invoices,
  brand,
  onSelectInvoice,
  onCreateNewInvoice,
  onUpdateInvoiceStatus,
  onDeleteInvoice,
  onDuplicateInvoice,
  onDownloadPdf,
  onEmailInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Paid' | 'Sent' | 'Draft' | 'Overdue'>('All');

  const { currentUser, isAuthenticated, signOut, openAuthModal } = useAuth();

  if (!isOpen) return null;

  // Compute Metrics
  const calculateTotal = (inv: InvoiceData) => {
    const subtotal = inv.items.reduce((acc, i) => acc + i.quantity * i.rate, 0);
    const tax = (subtotal * (inv.taxRate || 0)) / 100;
    return Math.max(0, subtotal + tax - (inv.discountAmount || 0));
  };

  const totalInvoiced = invoices.reduce((acc, inv) => acc + calculateTotal(inv), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((acc, inv) => acc + calculateTotal(inv), 0);
  const totalPending = invoices
    .filter((inv) => inv.status === 'Sent')
    .reduce((acc, inv) => acc + calculateTotal(inv), 0);
  const totalOverdue = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((acc, inv) => acc + calculateTotal(inv), 0);

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || inv.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: InvoiceData['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paid</span>
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Sent</span>
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue</span>
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]">
            <FileText className="w-3.5 h-3.5" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded text-white font-bold flex items-center justify-center text-sm shadow-sm bg-[var(--primary)]"
            >
              {brand.logoLetter || 'B'}
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--foreground)]">
                {brand.brandName || 'Billnest'} Invoices Dashboard
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Manage existing invoices, track payments, filter statuses & themes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active User Account Badge */}
            {isAuthenticated && currentUser ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-[var(--foreground)] truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                  {currentUser.provider === 'google' ? 'Google' : 'Email'}
                </span>
                <button
                  onClick={() => signOut()}
                  className="ml-1 text-[var(--muted-foreground)] hover:text-rose-500 cursor-pointer transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-orange-600" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={onCreateNewInvoice}
              className="btn-shader-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[var(--radius)] cursor-pointer"
            >
              <Plus className="w-4 h-4 btn-icon-hover-bounce" />
              <span>Create New Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)] cursor-pointer transition-transform hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[var(--background)]">
          {/* Metrics Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm">
              <span className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider block mb-1">
                Total Invoiced
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--foreground)]">
                ₹{totalInvoiced.toLocaleString()}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] mt-1 block">
                {invoices.length} total records
              </span>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
                Paid Revenue
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{totalPaid.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                {invoices.filter((i) => i.status === 'Paid').length} paid invoices
              </span>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider block mb-1">
                Pending / Sent
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                ₹{totalPending.toLocaleString()}
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 block">
                {invoices.filter((i) => i.status === 'Sent').length} awaiting payment
              </span>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-sm">
              <span className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider block mb-1">
                Overdue Total
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-red-600 dark:text-red-400">
                ₹{totalOverdue.toLocaleString()}
              </div>
              <span className="text-[11px] text-red-600 dark:text-red-400 mt-1 block">
                {invoices.filter((i) => i.status === 'Overdue').length} requiring follow-up
              </span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {(['All', 'Paid', 'Sent', 'Draft', 'Overdue'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-semibold transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search client, invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Client & Email</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date / Due</th>
                    <th className="p-3.5">Theme / Style</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[var(--muted-foreground)] text-sm">
                        No invoices found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const total = calculateTotal(inv);
                      return (
                        <tr
                          key={inv.id || inv.invoiceNumber}
                          className="hover:bg-[var(--muted)]/40 transition-colors"
                        >
                          {/* Invoice # */}
                          <td className="p-3.5 font-mono font-bold text-[var(--foreground)]">
                            {inv.invoiceNumber}
                          </td>

                          {/* Client */}
                          <td className="p-3.5">
                            <div className="font-semibold text-[var(--foreground)]">
                              {inv.clientName}
                            </div>
                            <div className="text-[11px] text-[var(--muted-foreground)]">
                              {inv.clientEmail}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <select
                              value={inv.status}
                              onChange={(e) =>
                                onUpdateInvoiceStatus(
                                  inv.id || inv.invoiceNumber,
                                  e.target.value as InvoiceData['status']
                                )
                              }
                              className="px-2 py-1 rounded text-xs font-semibold bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer"
                            >
                              <option value="Paid">Paid</option>
                              <option value="Sent">Sent</option>
                              <option value="Draft">Draft</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </td>

                          {/* Dates */}
                          <td className="p-3.5 text-[var(--muted-foreground)]">
                            <div>Issued: {inv.issueDate}</div>
                            <div className="text-[11px] text-[var(--foreground)] font-medium">
                              Due: {inv.dueDate}
                            </div>
                          </td>

                          {/* Theme & Style */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                                style={{ backgroundColor: inv.themeColor || 'var(--primary)' }}
                              ></span>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {inv.templateStyle || 'Modern'}
                              </span>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="p-3.5 text-right font-mono font-bold text-sm text-[var(--foreground)]">
                            {inv.currency}
                            {total.toLocaleString()}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onSelectInvoice(inv, false)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded hover:bg-[var(--muted)] cursor-pointer"
                                title="Open Short Preview/Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onSelectInvoice(inv, true)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded hover:bg-[var(--muted)] cursor-pointer"
                                title="Open Fullscreen View"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onDownloadPdf(inv)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-emerald-600 rounded hover:bg-[var(--muted)] cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onEmailInvoice(inv)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-blue-600 rounded hover:bg-[var(--muted)] cursor-pointer"
                                title="Share via Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onDuplicateInvoice(inv)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)] cursor-pointer"
                                title="Duplicate Invoice"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onDeleteInvoice(inv.id || inv.invoiceNumber)}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-red-600 rounded hover:bg-[var(--muted)] cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
