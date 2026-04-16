import { useState } from 'react';
import { getApiUrl } from '../lib/auth';

export default function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m TasteAI. Tell me what you\'re craving and your budget, and I\'ll recommend the best restaurants for you! 🍽️' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          budget: budget ? Number(budget) : undefined,
          cuisine: cuisine || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chat failed');

      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);

      // Fetch recommendations based on chat context
      if (budget || cuisine) {
        const recResponse = await fetch(getApiUrl('/api/ai/recommend'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budget: budget ? Number(budget) : undefined,
            cuisine: cuisine || undefined,
          }),
        });

        const recData = await recResponse.json();
        if (recResponse.ok) {
          setRecommendations(recData.recommendations || []);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: `❌ Error: ${error.message}` }]);
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-orange-100 p-6 flex justify-between items-center bg-gradient-to-r from-orange-50 to-green-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">TasteAI Chat</h2>
            <p className="text-sm text-gray-600 mt-1">Get personalized restaurant recommendations</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Budget & Cuisine Filters */}
        <div className="border-b border-orange-100 p-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Budget (TND)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 50"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Cuisine Type</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g., Italian"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-orange-100 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-orange-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="border-t border-orange-100 p-4 bg-white max-h-40 overflow-y-auto">
            <p className="text-xs font-bold text-gray-600 mb-3">✨ Recommended for you:</p>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rest) => (
                <div key={rest.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  {rest.image && (
                    <img
                      src={rest.image}
                      alt={rest.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{rest.name}</h4>
                    <p className="text-xs text-gray-600">
                      ⭐ {rest.rating} · {rest.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="border-t border-orange-100 p-4 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recommendations..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-orange-200 rounded-full text-sm focus:outline-none focus:border-orange-400 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '→'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
