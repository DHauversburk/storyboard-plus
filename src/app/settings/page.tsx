"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
    // defaults from env vars (masked for security if needed, but here we just show them for convenience in a local app)
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

    const [clientId, setClientId] = useState(envClientId);
    const [apiKey, setApiKey] = useState(envApiKey);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'saved'>('idle');
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        // Load overrides from localStorage if they exist, otherwise stick to env
        const storedClientId = localStorage.getItem('google_client_id');
        const storedApiKey = localStorage.getItem('google_api_key');
        const storedWebhook = localStorage.getItem('webhook_url');

        if (storedClientId) setClientId(storedClientId);
        if (storedApiKey) setApiKey(storedApiKey);
        if (storedWebhook) setWebhookUrl(storedWebhook);
    }, []);

    const handleSave = () => {
        localStorage.setItem('google_client_id', clientId);
        localStorage.setItem('google_api_key', apiKey);
        localStorage.setItem('webhook_url', webhookUrl);

        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-400 mb-8">Configure your workspace and integrations.</p>

            <div className="space-y-6">

                {/* Google Drive Integration Card */}
                <Card className="border-green-500/20 bg-green-900/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center text-green-400">
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M7.784 14l.42-2.184L8.7 11h6.6l.5 2.5.5 2.5h-9.5z" fill="#00AC47" /><path d="M8.7 11V8.5H5.8L4.35 11h4.35zM5.8 8.5H13.6L12.35 11H8.7V8.5z" fill="#0066DA" /><path d="M12.35 11l2.9-5h-5.8l-1.45 2.5 1.45 2.5h2.9z" fill="#EA4335" /><path d="M12.35 11L13.6 8.5h4.6l1.45 2.5-1.45 2.5H13.6l-1.25-2.5z" fill="#FFBA00" /><path d="M7.784 14H4.35l4.35 7.5L12.35 16l-4.566-2z" fill="#00AC47" /><path d="M13.6 16l4.35-7.5h-5.6l-2.9 5 2.9 5h4.6l-3.35-2.5z" fill="#2684FC" /></svg>
                            </span>
                            Google Drive Integration
                        </CardTitle>
                        <CardDescription>
                            {clientId && apiKey ? (
                                <span className="flex flex-col gap-1 mt-1">
                                    <span className="text-green-400 font-medium flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        System Connected & Ready
                                    </span>
                                    <span className="text-xs text-gray-500">Your configuration is active.</span>
                                </span>
                            ) : (
                                <span>Connect your Google Drive to sync drafts.</span>
                            )}
                            <br />
                            <button
                                onClick={() => setShowGuide(!showGuide)}
                                className="underline text-primary hover:text-primary/80 mt-2 inline-block font-medium"
                            >
                                {showGuide ? "Hide Setup Guide" : "Help! How do I set this up?"}
                            </button>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Interactive Guide */}
                        {showGuide && (
                            <div className="bg-black/40 border border-primary/20 rounded-lg p-6 space-y-4 animate-in slide-in-from-top-2">
                                <h3 className="font-semibold text-primary">Setup Wizard</h3>
                                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
                                    <li>
                                        Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-400 underline hover:text-blue-300">Google Cloud Credentials Page</a>.
                                    </li>
                                    <li>
                                        Click <strong>Create Credentials</strong> &rarr; <strong>OAuth Client ID</strong>.
                                        <ul className="pl-6 mt-1 text-gray-400 text-xs list-disc">
                                            <li>Application Type: <strong>Web Application</strong></li>
                                            <li>Authorized Origins: <code className="bg-white/10 px-1 rounded">http://localhost:3000</code></li>
                                        </ul>
                                    </li>
                                    <li>
                                        Copy the <strong>Client ID</strong> and paste it below.
                                    </li>
                                    <li>
                                        Go back and click <strong>Create Credentials</strong> &rarr; <strong>API Key</strong>.
                                    </li>
                                    <li>
                                        Copy the <strong>API Key</strong> and paste it below.
                                    </li>
                                </ol>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Client ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-gray-200 focus:border-green-500/50 outline-none transition-colors placeholder:text-gray-700"
                                    placeholder="12345...apps.googleusercontent.com"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                />
                                {envClientId && clientId === envClientId && (
                                    <p className="text-[10px] text-green-500/70 flex items-center gap-1">
                                        ✓ Loaded from Environment Variables
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">API Key</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-gray-200 focus:border-green-500/50 outline-none transition-colors placeholder:text-gray-700 font-mono"
                                    placeholder="AIza..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                {envApiKey && apiKey === envApiKey && (
                                    <p className="text-[10px] text-green-500/70 flex items-center gap-1">
                                        ✓ Loaded from Environment Variables
                                    </p>
                                )}
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <Button
                                    onClick={handleSave}
                                    className={`min-w-[120px] ${status === 'saved' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                                >
                                    {status === 'saved' ? 'Saved!' : 'Save Configuration'}
                                </Button>
                                {status === 'saved' && (
                                    <span className="text-xs text-green-400 animate-in fade-in">
                                        Configuration saved successfully.
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Automation & Webhooks Card */}
                <Card className="border-purple-500/20 bg-purple-900/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            Workflow Automation
                        </CardTitle>
                        <CardDescription>
                            Connect to external apps (Zapier, Make, n8n) via Webhooks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Webhook URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-md p-2 text-sm text-gray-200 focus:border-purple-500/50 outline-none transition-colors placeholder:text-gray-700 font-mono"
                                    placeholder="https://hooks.zapier.com/..."
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const url = webhookUrl;
                                        if (url) {
                                            fetch(url, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    event: 'test_ping',
                                                    timestamp: new Date().toISOString(),
                                                    app: 'StoryBoard+'
                                                })
                                            })
                                                .then(() => alert('Test Payload Sent!'))
                                                .catch(err => alert('Failed to send: ' + err.message));
                                        } else {
                                            alert('Please enter a URL first.');
                                        }
                                    }}
                                >
                                    Test
                                </Button>
                            </div>
                            <p className="text-[10px] text-gray-500">
                                We'll send a POST request with JSON data whenever you finish a scene draft or create a new character.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
