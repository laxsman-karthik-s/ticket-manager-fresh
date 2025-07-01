import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function List() {
  const [tickets, setTickets] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('priority') || '';
    setPriorityFilter(p);
    fetchTickets(p);
  }, [location.search]);

  const fetchTickets = async (priority) => {
    let query = supabase
      .from('tickets')
      .select(`
        id,
        subject,
        description,
        status,
        priority,
        churn_risk,
        eta_hours,
        created_at,
        assigned_agent_id,
        agents (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching tickets:', error);
      return;
    }

    setTickets(data);
  };

  const handlePriorityChange = (e) => {
    const selected = e.target.value;
    setPriorityFilter(selected);
    navigate(`/dashboard/list${selected ? `?priority=${selected}` : ''}`);
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-primary">📋 All Support Tickets</h2>
        <p className="text-muted">View and manage submitted complaints below</p>
      </div>

      <div className="d-flex justify-content-end mb-4 flex-wrap gap-2">
        <label htmlFor="priority-filter" className="form-label fw-medium me-2 mt-1">
          Filter by Priority:
        </label>
        <select
          id="priority-filter"
          className="form-select"
          style={{ maxWidth: '200px' }}
          value={priorityFilter}
          onChange={handlePriorityChange}
        >
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center text-muted fs-5">No tickets found.</div>
      ) : (
        <div className="row g-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="col-12">
              <div
                className="p-4 shadow-sm border rounded-4"
                style={{
                  background: '#ffffff',
                  borderLeft: '6px solid #5c6bc0'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="fw-bold text-dark mb-0">{ticket.subject}</h5>
                  <span className="badge bg-secondary-subtle text-dark px-3 py-1">{ticket.status}</span>
                </div>

                <p className="text-muted mb-3" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>

                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-indigo text-white px-3 py-2 rounded-pill">
                    Priority: {ticket.priority}
                  </span>
                  <span className="badge bg-indigo text-white px-3 py-2 rounded-pill">
                    Churn Risk: {ticket.churn_risk || 'unknown'}
                  </span>
                  <span className="badge bg-indigo text-white px-3 py-2 rounded-pill">
                    ETA: {ticket.eta_hours || 'N/A'} hrs
                  </span>
                  {ticket.agents?.name && (
                    <span className="badge bg-light border text-dark px-3 py-2 rounded-pill">
                      Assigned Agent: {ticket.agents.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indigo Badge Style */}
      <style>{`
        .bg-indigo {
          background-color: #5c6bc0 !important;
        }

        @media (max-width: 576px) {
          .form-select {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
