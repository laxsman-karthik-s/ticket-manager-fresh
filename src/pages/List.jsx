import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function List() {
  const [tickets, setTickets] = useState([])
  const [priorityFilter, setPriorityFilter] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  // On load or URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const p = params.get('priority') || ''
    setPriorityFilter(p)
    fetchTickets(p)
  }, [location.search])

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
      .order('created_at', { ascending: false })

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return
    }

    setTickets(data)
  }

  const handlePriorityChange = (e) => {
    const selected = e.target.value
    setPriorityFilter(selected)
    navigate(`/dashboard/list${selected ? `?priority=${selected}` : ''}`)
  }

  return (
    <div style={{
      maxWidth: '960px',
      margin: '40px auto',
      padding: '0 20px',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      color: '#333'
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: '30px'
      }}>
        🎫 All Tickets
      </h2>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: '30px'
      }}>
        <label htmlFor="priority-filter" style={{
          fontSize: '16px',
          fontWeight: '500',
          marginRight: '12px'
        }}>
          Filter by Priority:
        </label>
        <select
          id="priority-filter"
          value={priorityFilter}
          onChange={handlePriorityChange}
          style={{
            padding: '10px 15px',
            fontSize: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <p style={{
          fontStyle: 'italic',
          color: '#888',
          fontSize: '16px'
        }}>No tickets found.</p>
      ) : (
        <div>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                padding: '20px',
                marginBottom: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <h4 style={{ fontSize: '20px', marginBottom: '8px', color: '#37474f' }}>{ticket.subject}</h4>
              <p style={{ color: '#555', marginBottom: '10px' }}>{ticket.description}</p>
              <p style={{ marginBottom: '10px' }}>
                <strong>Status:</strong> <span style={{ color: '#0277bd' }}>{ticket.status}</span>
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {/* Gradient Badge Style */}
                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  background: 'linear-gradient(to right, #2196f3, #1976d2)'
                }}>
                  Priority: {ticket.priority}
                </span>

                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  background: 'linear-gradient(to right, #2196f3, #1976d2)'
                }}>
                  Churn Risk: {ticket.churn_risk || 'unknown'}
                </span>

                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  background: 'linear-gradient(to right, #2196f3, #1976d2)'
                }}>
                  ETA: {ticket.eta_hours || 'N/A'} hours
                </span>

                {/* Agent Badge - visually distinct */}
                {ticket.agents?.name && (
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: '#f3e5f5',
                    color: '#6a1b9a'
                  }}>
                    Assigned Agent: {ticket.agents.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
