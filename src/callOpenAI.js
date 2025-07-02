export async function chatWithOpenAI(messages) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const projectId = import.meta.env.VITE_OPENAI_PROJECT_ID;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Project': projectId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || 'Something went wrong');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('🔴 OpenAI Fetch Error:', err);
    throw err;
  }
}
