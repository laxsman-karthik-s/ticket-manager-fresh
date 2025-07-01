import { useRef, useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';

export default function Voice() {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [churnRisk, setChurnRisk] = useState('');
  const [etaHours, setEtaHours] = useState(null);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setText(event.results[0][0].transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const generateRephrasedContent = async (inputText) => {
    try {
      setLoading(true);

      const formattedPrompt = `Rephrase the user's complaint into a Subject and Description. Estimate:
- Priority (high/medium/low)
- Churn Risk (high/medium/low)
- ETA in hours.

Respond in this format:

Subject: ...
Description: ...
Priority: ...
Churn Risk: ...
ETA: <number>

Complaint: ${inputText}`;

      const response = await axios.post('http://localhost:5000/api/chat', {
        prompt: formattedPrompt,
      });

      const result = response.data.choices[0].message.content.trim();

      const match = result.match(
        /Subject:\s*(.+?)\n+Description:\s*(.+?)\n+Priority:\s*(.+?)\n+Churn Risk:\s*(.+?)\n+ETA:\s*(\d+)/i
      );

      if (match) {
        return {
          subject: match[1].trim(),
          description: match[2].trim(),
          priority: match[3].trim().toLowerCase(),
          churn_risk: match[4].trim().toLowerCase(),
          eta_hours: parseInt(match[5].trim()),
        };
      } else {
        return {
          subject: 'Voice Complaint',
          description: result,
          priority: 'medium',
          churn_risk: 'medium',
          eta_hours: 24,
        };
      }
    } catch (err) {
      console.error('❌ OpenAI Proxy error:', err);
      alert('Could not rephrase the complaint.');
      return {
        subject: 'Voice Complaint',
        description: inputText,
        priority: 'medium',
        churn_risk: 'medium',
        eta_hours: 24,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    stopRecording();

    const result = await generateRephrasedContent(text);
    setSubject(result.subject);
    setDescription(result.description);
    setPriority(result.priority);
    setChurnRisk(result.churn_risk);
    setEtaHours(result.eta_hours);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert('You must be logged in to submit a complaint.');
      return;
    }

    const { error } = await supabase.from('tickets').insert({
      customer_id: user.id,
      subject: result.subject,
      description: result.description,
      priority: result.priority,
      churn_risk: result.churn_risk,
      eta_hours: result.eta_hours,
      status: 'pending',
    });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      alert('✅ Ticket submitted successfully!');
      setText('');
    }
  };

  return (
    <div className="container-fluid px-5 py-5" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12">
          <div
            className="card shadow border-0 p-5 rounded-4 mx-auto"
            style={{
              backgroundColor: '#fff',
              maxWidth: '1300px',
              width: '100%',
            }}
          >
            <h3 className="fw-bold mb-4 text-primary">🎙 Submit a Voice Complaint</h3>

            {/* Start/Stop Buttons */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <button
                  className="btn btn-success w-100"
                  onClick={startRecording}
                  disabled={recording}
                >
                  <i className="bi bi-mic-fill me-2"></i> Start Recording
                </button>
              </div>
              <div className="col-md-6">
                <button
                  className="btn btn-danger w-100"
                  onClick={stopRecording}
                  disabled={!recording}
                >
                  <i className="bi bi-stop-fill me-2"></i> Stop
                </button>
              </div>
            </div>

            {/* Voice Transcript (Full Width) */}
            <div className="mb-4">
              <label htmlFor="transcript" className="form-label fw-semibold text-muted">
                Voice Transcript
              </label>
              <textarea
                id="transcript"
                className="form-control"
                rows={7}
                placeholder="Your speech will appear here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ fontSize: '15px', width: '100%' }}
              />
            </div>

            {/* Complaint Summary */}
            {subject && (
              <div className="bg-light border rounded p-3 mb-4">
                <h5 className="fw-semibold mb-3 text-dark">📄 Complaint Summary</h5>
                <p className="mb-1"><strong>Subject:</strong> {subject}</p>
                <p className="mb-1"><strong>Description:</strong> {description}</p>
                <p className="mb-1"><strong>Priority:</strong> <span className="text-capitalize">{priority}</span></p>
                <p className="mb-1"><strong>Churn Risk:</strong> <span className="text-capitalize">{churnRisk}</span></p>
                <p className="mb-0"><strong>ETA (Hours):</strong> {etaHours}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center mt-4">
              <button
                className="fw-semibold px-5 py-2 border-0"
                style={{
                  fontSize: '16px',
                  background: 'linear-gradient(to right, #2196f3, #1e88e5)',
                  color: '#fff',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '300px'
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Processing...
                  </>
                ) : (
                  '📝 Submit Complaint'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
