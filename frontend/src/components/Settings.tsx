import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function Settings() {
  const [configs, setConfigs] = useState({
    jiraUrl: "https://your-domain.atlassian.net",
    jiraUsername: "your-email@domain.com",
    jiraApiToken: "",
    llmProvider: "ollama",
    openAiKey: "",
    ollamaBaseUrl: "http://host.docker.internal:11434",
    ollamaModel: "llama3.2:1b"
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/settings")
      .then(res => res.json())
      .then(data => {
        setConfigs({
          jiraUrl: data.jira_url || "",
          jiraUsername: data.jira_username || "",
          jiraApiToken: data.jira_api_token || "",
          llmProvider: data.llm_provider || "ollama",
          openAiKey: data.openai_api_key || "",
          ollamaBaseUrl: data.ollama_base_url || "",
          ollamaModel: data.ollama_model || ""
        });
      })
      .catch(err => console.error("Failed to load settings", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfigs(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    
    try {
      const res = await fetch("http://localhost:8000/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(configs)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-3xl">
      <div className="bg-card/50 border border-border p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-gray-300" />
        <h2 className="text-2xl font-bold mb-6">Configuration</h2>
        
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Jira Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Jira URL</label>
                <input 
                  type="url" 
                  name="jiraUrl"
                  value={configs.jiraUrl}
                  onChange={handleChange}
                  className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  placeholder="https://your-domain.atlassian.net"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Jira Username</label>
                <input 
                  type="email" 
                  name="jiraUsername"
                  value={configs.jiraUsername}
                  onChange={handleChange}
                  className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  placeholder="your-email@domain.com"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm text-muted-foreground font-medium">Jira API Token</label>
                <input 
                  type="password" 
                  name="jiraApiToken"
                  value={configs.jiraApiToken}
                  onChange={handleChange}
                  className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  placeholder="Enter your Jira API token"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">AI Settings</h3>
            <div className="flex flex-col gap-2 mb-4 md:w-1/2">
              <label className="text-sm text-muted-foreground font-medium">LLM Provider</label>
              <select 
                name="llmProvider"
                value={configs.llmProvider}
                onChange={handleChange}
                className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="ollama" className="bg-slate-900 text-white">Ollama</option>
                <option value="openai" className="bg-slate-900 text-white">OpenAI</option>
              </select>
            </div>

            {configs.llmProvider === "openai" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">OpenAI API Key</label>
                <input 
                  type="password" 
                  name="openAiKey"
                  value={configs.openAiKey}
                  onChange={handleChange}
                  className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  placeholder="sk-..."
                  required
                />
              </div>
            )}

            {configs.llmProvider === "ollama" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground font-medium">Ollama Base URL</label>
                  <input 
                    type="url" 
                    name="ollamaBaseUrl"
                    value={configs.ollamaBaseUrl}
                    onChange={handleChange}
                    className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground font-medium">Ollama Model</label>
                  <input 
                    type="text" 
                    name="ollamaModel"
                    value={configs.ollamaModel}
                    onChange={handleChange}
                    className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Configuration"}
            </button>
            {saved && (
              <span className="text-emerald-400 text-sm animate-fade-in">
                Configuration saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
