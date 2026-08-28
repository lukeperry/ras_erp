import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  createQuotation,
  getPipelineList,
  getPipelineSummary,
  getQuoteFormOptions,
  type PipelineRecord,
  type PipelineStage,
  type PipelineSummary,
  type QuoteFormOptions,
} from '../api/client';

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'leads', label: 'Leads', color: '#3B82F6' },
  { key: 'quotations', label: 'Quotations', color: '#F59E0B' },
  { key: 'sales_orders', label: 'Sales Orders', color: '#8B5CF6' },
  { key: 'delivery_notes', label: 'Delivery Notes', color: '#10B981' },
  { key: 'sales_invoices', label: 'Sales Invoices', color: '#EF4444' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [activeStage, setActiveStage] = useState<PipelineStage>('quotations');
  const [records, setRecords] = useState<PipelineRecord[]>([]);
  const [quoteOptions, setQuoteOptions] = useState<QuoteFormOptions | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteState, setQuoteState] = useState({
    lead_name: '',
    customer: '',
    project_reference: '',
    requested_delivery_date: '',
    item_code: '',
    item_description: '',
    qty: '1',
    rate: '0',
    uom: 'Nos',
  });
  const [quoteResult, setQuoteResult] = useState<string | null>(null);

  useEffect(() => {
    getPipelineSummary().then(setSummary).catch(() => setError('Failed to load pipeline summary'));
  }, []);

  useEffect(() => {
    getQuoteFormOptions().then(setQuoteOptions).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoadingList(true);
    setError(null);
    getPipelineList(activeStage)
      .then(setRecords)
      .catch(() => setError('Failed to load records'))
      .finally(() => setLoadingList(false));
  }, [activeStage]);

  const summaryKeyByStage: Record<PipelineStage, keyof PipelineSummary> = {
    leads: 'leads',
    quotations: 'quotations',
    sales_orders: 'sales_orders',
    delivery_notes: 'delivery_notes',
    sales_invoices: 'sales_invoices',
  };

  const columns = getColumnsFor(activeStage);

  async function handleCreateQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setQuoteResult(null);

    try {
      const result = await createQuotation({
        lead_name: quoteState.lead_name || undefined,
        customer: quoteState.customer || undefined,
        project_reference: quoteState.project_reference || undefined,
        requested_delivery_date: quoteState.requested_delivery_date || undefined,
        item_code: quoteState.item_code || undefined,
        item_description: quoteState.item_description || undefined,
        qty: Number(quoteState.qty || 1),
        rate: Number(quoteState.rate || 0),
        uom: quoteState.uom || 'Nos',
      });
      setQuoteResult(`Quotation ${result.name} created successfully.`);
      setQuoteState({
        lead_name: '',
        customer: '',
        project_reference: '',
        requested_delivery_date: '',
        item_code: '',
        item_description: '',
        qty: '1',
        rate: '0',
        uom: 'Nos',
      });
      setActiveStage('quotations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create quotation';
      setError(message);
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>RAS Sales Desk</h1>
        <div className="user-info">
          <span>{user?.full_name}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="summary-cards">
        {STAGES.map((stage) => (
          <button
            key={stage.key}
            className={`summary-card ${activeStage === stage.key ? 'active' : ''}`}
            style={{ borderTopColor: stage.color }}
            onClick={() => setActiveStage(stage.key)}
          >
            <span className="summary-count">
              {summary ? summary[summaryKeyByStage[stage.key]] : '…'}
            </span>
            <span className="summary-label">{stage.label}</span>
          </button>
        ))}
      </section>

      <section className="quote-panel">
        <h2>Create quotation</h2>
        <form onSubmit={handleCreateQuotation} className="quote-form">
          <div className="form-grid">
            <label>
              Lead
              <select
                value={quoteState.lead_name}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, lead_name: e.target.value }))}
              >
                <option value="">Select lead</option>
                {quoteOptions?.leads.map((lead) => (
                  <option key={lead.name} value={lead.name}>
                    {lead.lead_name || lead.company_name || lead.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Customer
              <select
                value={quoteState.customer}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, customer: e.target.value }))}
              >
                <option value="">Select customer</option>
                {quoteOptions?.customers.map((customer) => (
                  <option key={customer.name} value={customer.name}>
                    {customer.customer_name || customer.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Project reference
              <input
                value={quoteState.project_reference}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, project_reference: e.target.value }))}
              />
            </label>

            <label>
              Requested delivery date
              <input
                type="datetime-local"
                value={quoteState.requested_delivery_date}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, requested_delivery_date: e.target.value }))}
              />
            </label>

            <label>
              Item code
              <input
                value={quoteState.item_code}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, item_code: e.target.value }))}
              />
            </label>

            <label>
              Item description
              <input
                value={quoteState.item_description}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, item_description: e.target.value }))}
              />
            </label>

            <label>
              Qty
              <input
                type="number"
                min="1"
                value={quoteState.qty}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, qty: e.target.value }))}
              />
            </label>

            <label>
              Rate
              <input
                type="number"
                min="0"
                step="0.01"
                value={quoteState.rate}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, rate: e.target.value }))}
              />
            </label>

            <label>
              UOM
              <input
                value={quoteState.uom}
                onChange={(e) => setQuoteState((prev) => ({ ...prev, uom: e.target.value }))}
              />
            </label>
          </div>

          <div className="quote-actions">
            <button type="submit">Generate quotation</button>
          </div>
          {quoteResult && <p className="success">{quoteResult}</p>}
        </form>
      </section>

      <section className="record-list">
        <h2>{STAGES.find((s) => s.key === activeStage)?.label}</h2>
        {error && <p className="error">{error}</p>}
        {loadingList ? (
          <p>Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={columns.length}>No records found</td>
                </tr>
              )}
              {records.map((record) => (
                <tr key={record.name}>
                  {columns.map((col) => (
                    <td key={col.key}>{formatValue(record[col.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function getColumnsFor(stage: PipelineStage): { key: string; label: string }[] {
  const common = [{ key: 'name', label: 'ID' }];
  const byStage: Record<PipelineStage, { key: string; label: string }[]> = {
    leads: [
      { key: 'lead_name', label: 'Lead Name' },
      { key: 'company_name', label: 'Company' },
      { key: 'status', label: 'Status' },
    ],
    quotations: [
      { key: 'party_name', label: 'Customer' },
      { key: 'project_reference', label: 'Project Ref' },
      { key: 'requested_delivery_date', label: 'Requested Delivery' },
      { key: 'grand_total', label: 'Total' },
      { key: 'status', label: 'Status' },
    ],
    sales_orders: [
      { key: 'customer', label: 'Customer' },
      { key: 'delivery_date', label: 'Delivery Date' },
      { key: 'grand_total', label: 'Total' },
      { key: 'status', label: 'Status' },
    ],
    delivery_notes: [
      { key: 'customer', label: 'Customer' },
      { key: 'posting_date', label: 'Posting Date' },
      { key: 'status', label: 'Status' },
    ],
    sales_invoices: [
      { key: 'customer', label: 'Customer' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'grand_total', label: 'Total' },
      { key: 'status', label: 'Status' },
    ],
  };
  return [...common, ...byStage[stage]];
}
