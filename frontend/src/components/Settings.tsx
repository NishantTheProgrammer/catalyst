import { useState, useEffect } from "react";
import { Save, Plug, CheckCircle2, AlertCircle, Search, X } from "lucide-react";

export default function Settings() {
  const [configs, setConfigs] = useState({
    jiraUrl: "https://your-domain.atlassian.net",
    jiraUsername: "your-email@domain.com",
    jiraApiToken: "",
    llmProvider: "ollama",
    openAiKey: "",
    ollamaBaseUrl: "http://host.docker.internal:11434",
    ollamaModel: "llama3.2:1b",
    jiraSelectedProjects: "",
    jiraSyncDays: 30,
    jiraSyncLimit: 30
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{status: 'success' | 'error' | null, message?: string}>({status: null});
  const [availableProjects, setAvailableProjects] = useState<{key: string, name: string}[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  
  const [testingLlm, setTestingLlm] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<{status: 'success' | 'error' | null, message?: string}>({status: null});

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
          ollamaModel: data.ollama_model || "",
          jiraSelectedProjects: data.jira_selected_projects || "",
          jiraSyncDays: data.jira_sync_days || 30,
          jiraSyncLimit: data.jira_sync_limit || 30
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
      const payload = {
        ...configs,
        jira_selected_projects: configs.jiraSelectedProjects,
        jira_sync_days: Number(configs.jiraSyncDays),
        jira_sync_limit: Number(configs.jiraSyncLimit)
      };
      
      const res = await fetch("http://localhost:8000/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult({ status: null });
    try {
      const res = await fetch("http://localhost:8000/api/settings/jira/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jira_url: configs.jiraUrl,
          jira_username: configs.jiraUsername,
          jira_api_token: configs.jiraApiToken
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setTestResult({ status: 'success', message: `Connected! Found ${data.projects.length} projects.` });
        setAvailableProjects(data.projects);
      } else {
        setTestResult({ status: 'error', message: data.detail || "Connection failed." });
      }
    } catch (err) {
      setTestResult({ status: 'error', message: "Network error or server unreachable." });
    } finally {
      setTesting(false);
    }
  };

  const handleTestLlmConnection = async () => {
    setTestingLlm(true);
    setLlmTestResult({ status: null });
    try {
      const res = await fetch("http://localhost:8000/api/settings/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          llm_provider: configs.llmProvider,
          openai_api_key: configs.openAiKey,
          ollama_base_url: configs.ollamaBaseUrl,
          ollama_model: configs.ollamaModel
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setLlmTestResult({ status: 'success', message: data.message });
      } else {
        setLlmTestResult({ status: 'error', message: data.detail || "Connection failed." });
      }
    } catch (err) {
      setLlmTestResult({ status: 'error', message: "Network error or server unreachable." });
    } finally {
      setTestingLlm(false);
    }
  };

  const toggleProject = (projectKey: string) => {
    const current = configs.jiraSelectedProjects ? configs.jiraSelectedProjects.split(",").map(p => p.trim()).filter(Boolean) : [];
    if (current.includes(projectKey)) {
      setConfigs(prev => ({ ...prev, jiraSelectedProjects: current.filter(k => k !== projectKey).join(",") }));
    } else {
      setConfigs(prev => ({ ...prev, jiraSelectedProjects: [...current, projectKey].join(",") }));
    }
  };

  const selectedProjectsList = configs.jiraSelectedProjects ? configs.jiraSelectedProjects.split(",").map(p => p.trim()).filter(Boolean) : [];

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
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Sync History (Days Back)</label>
                <input 
                  type="number" 
                  name="jiraSyncDays"
                  value={configs.jiraSyncDays}
                  onChange={handleChange}
                  className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  min="1"
                  max="365"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground font-medium">Max Tickets to Sync</label>
                <input 
                  type="number" 
                  name="jiraSyncLimit"
                  value={configs.jiraSyncLimit}
                  onChange={handleChange}
                  className="bg-secondary/30 border border-border p-3 rounded-lg text-white outline-none focus:border-primary transition-colors"
                  min="1"
                  max="200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2 p-4 bg-secondary/10 border border-border rounded-xl">
              <div className="flex items-center gap-4">
                  <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-300 text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                    testing ? "opacity-70 cursor-not-allowed scale-95 shadow-none hover:shadow-none hover:-translate-y-0" : ""
                  }`}
                >
                  {testing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4 group-hover:animate-bounce" />
                      Test Connection
                    </>
                  )}
                </button>
                
                {testResult.status === 'success' && (
                  <span className="flex items-center gap-1 text-sm text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> {testResult.message}
                  </span>
                )}
                {testResult.status === 'error' && (
                  <span className="flex items-center gap-1 text-sm text-rose-400">
                    <AlertCircle className="w-4 h-4" /> {testResult.message}
                  </span>
                )}
              </div>
              
              {availableProjects.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm text-muted-foreground font-medium mb-2 block">
                    Select Projects to Sync (Leave empty to sync all)
                  </label>
                  
                  {selectedProjectsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedProjectsList.map(projectKey => {
                        const project = availableProjects.find(p => p.key === projectKey);
                        const label = project ? project.name : projectKey;
                        return (
                          <div key={projectKey} className="flex items-center gap-1 bg-primary/20 border border-primary/50 text-white px-3 py-1 rounded-full text-sm shadow-sm transition-transform hover:scale-105">
                            <span>{label}</span>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); toggleProject(projectKey); }}
                              className="hover:bg-primary/50 hover:text-rose-300 rounded-full p-0.5 ml-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search projects by name or key..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-background/50 border border-border rounded-lg text-sm text-white focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-border bg-secondary/20 rounded-lg">
                    {availableProjects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.key.toLowerCase().includes(projectSearch.toLowerCase())).map(project => {
                      const isSelected = selectedProjectsList.includes(project.key);
                      return (
                        <div 
                          key={project.key} 
                          onClick={() => toggleProject(project.key)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-colors ${
                            isSelected ? 'bg-primary/20 border-primary/50 text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <span className="text-sm truncate mr-2" title={project.name}>{project.name}</span>
                          <span className="text-xs font-mono opacity-60 bg-black/20 px-1.5 py-0.5 rounded">{project.key}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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
            
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={handleTestLlmConnection}
                disabled={testingLlm}
                className={`flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-300 text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                  testingLlm ? "opacity-70 cursor-not-allowed scale-95 shadow-none hover:shadow-none hover:-translate-y-0" : ""
                }`}
              >
                {testingLlm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Plug className="w-4 h-4 group-hover:animate-bounce" />
                    Test LLM Connection
                  </>
                )}
              </button>
              
              {llmTestResult.status === 'success' && (
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> {llmTestResult.message}
                </span>
              )}
              {llmTestResult.status === 'error' && (
                <span className="flex flex-col gap-1 text-sm text-rose-400">
                  <span className="flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4 shrink-0" /> Connection Failed</span>
                  <span className="text-xs opacity-80 pl-5">{llmTestResult.message}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button 
              type="submit" 
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                saving ? "opacity-70 cursor-not-allowed scale-95 shadow-none hover:shadow-none hover:-translate-y-0" : ""
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Configuration
                </>
              )}
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
