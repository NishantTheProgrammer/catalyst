'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Plug,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Trash2,
  Layers,
  Cpu,
} from 'lucide-react';

export default function Settings() {
  const [configs, setConfigs] = useState({
    jiraUrl: 'https://your-domain.atlassian.net',
    jiraUsername: 'your-email@domain.com',
    jiraApiToken: '',
    llmProvider: 'ollama',
    openAiKey: '',
    openaiModel: 'gpt-4o-mini',
    geminiKey: '',
    geminiModel: 'gemini-2.5-flash',
    ollamaBaseUrl: 'http://host.docker.internal:11434',
    ollamaModel: 'llama3.2:1b',
    jiraSelectedProjects: '',
    jiraSyncDays: 30,
    jiraSyncLimit: 30,
    perSprintLimit: 50,
    sprintsToLoad: 3,
    syncMode: 'last_n_sprints',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error' | null; message?: string }>({ status: null });
  const [availableProjects, setAvailableProjects] = useState<{ key: string; name: string }[]>([]);
  const [projectSearch, setProjectSearch] = useState('');

  const [testingLlm, setTestingLlm] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<{ status: 'success' | 'error' | null; message?: string }>({ status: null });

  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to delete ALL tickets and analysis data? Your configuration settings will be preserved.')) return;

    setResetting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('All data wiped successfully! The page will now reload.');
        window.location.reload();
      } else {
        alert('Failed to wipe data.');
      }
    } catch (err) {
      console.error(err);
      alert('Error while wiping data.');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`)
      .then((res) => res.json())
      .then((data) => {
        setConfigs({
          jiraUrl: data.jira_url || '',
          jiraUsername: data.jira_username || '',
          jiraApiToken: data.jira_api_token || '',
          llmProvider: data.llm_provider || 'ollama',
          openAiKey: data.openai_api_key || '',
          openaiModel: data.openai_model || 'gpt-4o-mini',
          geminiKey: data.gemini_api_key || '',
          geminiModel: data.gemini_model || 'gemini-2.5-flash',
          ollamaBaseUrl: data.ollama_base_url || '',
          ollamaModel: data.ollama_model || '',
          jiraSelectedProjects: data.jira_selected_projects || '',
          jiraSyncDays: data.jira_sync_days || 30,
          jiraSyncLimit: data.jira_sync_limit || 30,
          perSprintLimit: data.per_sprint_limit || 50,
          sprintsToLoad: data.sprints_to_load || 3,
          syncMode: data.sync_mode || 'last_n_sprints',
        });
      })
      .catch((err) => console.error('Failed to load settings', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfigs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        jira_url: configs.jiraUrl,
        jira_username: configs.jiraUsername,
        jira_api_token: configs.jiraApiToken,
        llm_provider: configs.llmProvider,
        openAiKey: configs.openAiKey,
        openai_model: configs.openaiModel,
        geminiKey: configs.geminiKey,
        gemini_model: configs.geminiModel,
        ollama_base_url: configs.ollamaBaseUrl,
        ollama_model: configs.ollamaModel,
        jira_selected_projects: configs.jiraSelectedProjects,
        jira_sync_days: Number(configs.jiraSyncDays),
        jira_sync_limit: Number(configs.jiraSyncLimit),
        per_sprint_limit: Number(configs.perSprintLimit),
        sprints_to_load: Number(configs.sprintsToLoad),
        sync_mode: configs.syncMode,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult({ status: null });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/jira/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jira_url: configs.jiraUrl,
          jira_username: configs.jiraUsername,
          jira_api_token: configs.jiraApiToken,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTestResult({ status: 'success', message: `Connected! Found ${data.projects.length} accessible projects.` });
        setAvailableProjects(data.projects);
      } else {
        setTestResult({ status: 'error', message: data.detail || 'Connection failed.' });
      }
    } catch (err) {
      setTestResult({ status: 'error', message: 'Network error or server unreachable.' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestLlmConnection = async () => {
    setTestingLlm(true);
    setLlmTestResult({ status: null });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings/llm/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llm_provider: configs.llmProvider,
          openai_api_key: configs.openAiKey,
          openai_model: configs.openaiModel,
          gemini_api_key: configs.geminiKey,
          gemini_model: configs.geminiModel,
          ollama_base_url: configs.ollamaBaseUrl,
          ollama_model: configs.ollamaModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setLlmTestResult({ status: 'success', message: data.message });
      } else {
        setLlmTestResult({ status: 'error', message: data.detail || 'Connection failed.' });
      }
    } catch (err) {
      setLlmTestResult({ status: 'error', message: 'Network error or server unreachable.' });
    } finally {
      setTestingLlm(false);
    }
  };

  const toggleProject = (projectKey: string) => {
    const current = configs.jiraSelectedProjects ? configs.jiraSelectedProjects.split(',').map((p) => p.trim()).filter(Boolean) : [];
    if (current.includes(projectKey)) {
      setConfigs((prev) => ({ ...prev, jiraSelectedProjects: current.filter((k) => k !== projectKey).join(',') }));
    } else {
      setConfigs((prev) => ({ ...prev, jiraSelectedProjects: [...current, projectKey].join(',') }));
    }
  };

  const selectedProjectsList = configs.jiraSelectedProjects
    ? configs.jiraSelectedProjects.split(',').map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <form onSubmit={handleSave} className="space-y-8">
        <section
          className="glass rounded-2xl p-6 sm:p-7 space-y-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Plug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Jira Cloud Integration</h2>
              <p className="text-xs text-slate-400">Connect to your Atlassian workspace to sync project tickets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jira URL</label>
              <input
                type="url"
                name="jiraUrl"
                value={configs.jiraUrl}
                onChange={handleChange}
                className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="https://your-domain.atlassian.net"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Email</label>
              <input
                type="email"
                name="jiraUsername"
                value={configs.jiraUsername}
                onChange={handleChange}
                className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="your-email@domain.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">API Token</label>
              <input
                type="password"
                name="jiraApiToken"
                value={configs.jiraApiToken}
                onChange={handleChange}
                className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Enter Jira API token"
              />
            </div>
          </div>

          {/* Test Jira Connection Bar */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="glass px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Plug className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing connection...' : 'Test Jira Connection'}</span>
              </button>

              {testResult.status === 'success' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {testResult.message}
                </span>
              )}
              {testResult.status === 'error' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {testResult.message}
                </span>
              )}
            </div>

            {/* Project Multi-selector */}
            {availableProjects.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Select Projects to Sync (Leave empty to sync all)
                </label>

                {selectedProjectsList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProjectsList.map((projectKey) => {
                      const project = availableProjects.find((p) => p.key === projectKey);
                      const label = project ? project.name : projectKey;
                      return (
                        <div
                          key={projectKey}
                          className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          <span>{label}</span>
                          <button
                            type="button"
                            onClick={() => toggleProject(projectKey)}
                            className="hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter projects by key or name..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-black/30 rounded-xl border border-white/5">
                  {availableProjects
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                        p.key.toLowerCase().includes(projectSearch.toLowerCase())
                    )
                    .map((project) => {
                      const isSelected = selectedProjectsList.includes(project.key);
                      return (
                        <div
                          key={project.key}
                          onClick={() => toggleProject(project.key)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-500/20 border-indigo-500/40 text-white font-semibold'
                              : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate mr-2" title={project.name}>{project.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">{project.key}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Sync Settings ── */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 space-y-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Sprint &amp; Sync Range</h2>
              <p className="text-xs text-slate-400">Configure ticket ingestion boundaries and sprint depth</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sync Mode</label>
              <select
                name="syncMode"
                value={configs.syncMode}
                onChange={handleChange}
                className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="last_n_sprints" className="bg-slate-900 text-white">Last N Sprints</option>
                <option value="active_only" className="bg-slate-900 text-white">Active Sprint Only</option>
                <option value="date_range" className="bg-slate-900 text-white">Date Range (Days Back)</option>
              </select>
            </div>

            {configs.syncMode === 'last_n_sprints' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sprints to Load</label>
                <input
                  type="number"
                  name="sprintsToLoad"
                  value={configs.sprintsToLoad}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Max Tickets per Sprint</label>
              <input
                type="number"
                name="perSprintLimit"
                value={configs.perSprintLimit}
                onChange={handleChange}
                min="10"
                max="500"
                step="10"
                className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ── Section 4: AI Provider Settings ── */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 space-y-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">AI Engine &amp; LLM Configuration</h2>
              <p className="text-xs text-slate-400">Select local Ollama or hosted OpenAI / Google Gemini models</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:w-1/2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">LLM Provider</label>
            <select
              name="llmProvider"
              value={configs.llmProvider}
              onChange={handleChange}
              className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ollama" className="bg-slate-900 text-white">Ollama (Local Private)</option>
              <option value="gemini" className="bg-slate-900 text-white">Google Gemini</option>
              <option value="openai" className="bg-slate-900 text-white">OpenAI</option>
            </select>
          </div>

          {configs.llmProvider === 'openai' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">OpenAI API Key</label>
                <input
                  type="password"
                  name="openAiKey"
                  value={configs.openAiKey}
                  onChange={handleChange}
                  placeholder="sk-..."
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">OpenAI Model</label>
                <input
                  type="text"
                  name="openaiModel"
                  value={configs.openaiModel}
                  onChange={handleChange}
                  placeholder="gpt-4o-mini"
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {configs.llmProvider === 'gemini' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gemini API Key</label>
                <input
                  type="password"
                  name="geminiKey"
                  value={configs.geminiKey}
                  onChange={handleChange}
                  placeholder="AIzaSy..."
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gemini Model</label>
                <input
                  type="text"
                  name="geminiModel"
                  value={configs.geminiModel}
                  onChange={handleChange}
                  placeholder="gemini-2.5-flash"
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {configs.llmProvider === 'ollama' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ollama Base URL</label>
                <input
                  type="url"
                  name="ollamaBaseUrl"
                  value={configs.ollamaBaseUrl}
                  onChange={handleChange}
                  placeholder="http://host.docker.internal:11434"
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ollama Model</label>
                <input
                  type="text"
                  name="ollamaModel"
                  value={configs.ollamaModel}
                  onChange={handleChange}
                  placeholder="llama3.2:1b"
                  className="bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleTestLlmConnection}
              disabled={testingLlm}
              className="glass px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Cpu className={`w-3.5 h-3.5 ${testingLlm ? 'animate-spin text-pink-400' : ''}`} />
              <span>{testingLlm ? 'Testing LLM...' : 'Test LLM Connection'}</span>
            </button>

            {llmTestResult.status === 'success' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {llmTestResult.message}
              </span>
            )}
            {llmTestResult.status === 'error' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" /> {llmTestResult.message}
              </span>
            )}
          </div>
        </section>

        {/* ── Save Settings Button ── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
          {saved && (
            <span className="text-xs font-semibold text-emerald-400 animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Configuration saved successfully!
            </span>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-rose-400">Danger Zone</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently wipe all synced tickets, analyses, and sprint metrics. Settings will be retained.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{resetting ? 'Wiping...' : 'Wipe All Data'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
