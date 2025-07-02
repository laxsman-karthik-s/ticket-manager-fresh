import { useState } from 'react';
import { supabase } from '../supabase';
import { chatWithOpenAI } from '../callOpenAi';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'You', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const newContext = context + `User: ${input}\n`;
      setContext(newContext);

      const openaiResponse = await chatWithOpenAI([
        {
          role: 'system',
          content: `You are a support assistant. Gather enough information about the user's complaint.
Once enough info is collected, respond only in this format:

SUBJECT: <short title>
DESCRIPTION: <detailed explanation>
PRIORITY: <high | medium | low>
CHURN RISK: <high | medium | low>
ETA: <number of hours>
RESPONSE: An agent will be assigned to you shortly.

Context:
${newContext}`
        },
        {
          role: 'user',
          content: input
        }
      ]);

      const botText = openaiResponse.choices?.[0]?.message?.content;
      if (!botText) throw new Error('Invalid OpenAI response');

      setMessages(prev => [...prev, { sender: 'Support Bot', text: botText }]);

      // Try extracting ticket data
      const subjectMatch = botText.match(/SUBJECT:\s*(.+)/i);
      const descMatch = botText.match(/DESCRIPTION:\s*([\s\S]+?)PRIORITY:/i);
      const priorityMatch = botText.match(/PRIORITY:\s*(high|medium|low)/i);
      const churnMatch = botText.match(/CHURN RISK:\s*(high|medium|low)/i);
      const etaMatch = botText.match(/ETA:\s*(\d+)/i);

      if (subjectMatch && descMatch && priorityMatch && churnMatch && etaMatch) {
        const subject = subjectMatch[1].trim();
        const description = descMatch[1].trim();
        const priority = priorityMatch[1].trim().toLowerCase();
        const churn_risk = churnMatch[1].trim().toLowerCase();
        const eta_hours = parseInt(etaMatch[1]);

        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user?.id) {
          alert('You must be logged in to submit a ticket.');
          return;
        }

        const { error } = await supabase.from('tickets').insert({
          customer_id: userData.user.id,
          subject,
          description,
          priority,
          churn_risk,
          eta_hours,
          status: 'pending'
        });

        if (error) {
          setMessages(prev => [...prev, { sender: 'System', text: '❌ Failed to create ticket: ' + error.message }]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              sender: 'System',
              text: `✅ Ticket Created\nSubject: ${subject}\nPriority: ${priority}\nChurn Risk: ${churn_risk}\nETA: ${eta_hours} hrs.`
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { sender: 'System', text: '❌ Something went wrong. Please try again.' }]);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center py-5" style={{ backgroundColor: '#f4f7fa', minHeight: '100vh' }}>
      <div className="w-100 px-3" style={{ maxWidth: '700px' }}>
        <div className="bg-white border rounded-4 shadow p-4">
          <h3 className="fw-bold text-center text-primary mb-4">💬 Helpdesk Assistant</h3>

          <div
            className="chat-box rounded-3 p-3 mb-4"
            style={{
              height: '400px',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0'
            }}
          >
            {messages.length === 0 ? (
              <p className="text-muted text-center mt-5">Type your issue below to start chatting...</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 p-3 rounded-4 shadow-sm ${
                    msg.sender === 'You'
                      ? 'bg-primary text-white ms-auto'
                      : msg.sender === 'Support Bot'
                      ? 'bg-info-subtle text-dark'
                      : 'bg-light text-dark'
                  }`}
                  style={{
                    maxWidth: '85%',
                    whiteSpace: 'pre-wrap',
                    animation: 'fadeIn 0.3s ease-in'
                  }}
                >
                  <div className="fw-semibold small mb-1" style={{ opacity: 0.75 }}>
                    {msg.sender}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2">
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ fontSize: '1rem' }}
            />
            <button className="btn btn-primary rounded-3 fw-semibold px-4" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 576px) {
          .chat-box {
            height: 320px;
          }
        }
      `}</style>
    </div>
  );
}
