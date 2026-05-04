import React, { useState } from "react";
import { Send, Smartphone, Mail, AlertTriangle, MessageCircle, Type, Globe, SlidersHorizontal, Info } from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_VARIABLES = {
  studentName: "Alex Chen",
  parentName: "Mr. and Mrs. Chen",
  attendanceRate: "68",
  cgpa: "6.8",
  subject: "Fluid Dynamics",
  aiInsight: "AI Insight: This attendance pattern has a high historical correlation with academic decline. Immediate intervention requested."
};

const DEFAULT_TEMPLATE = `Dear {{parentName}},

We are writing to inform you that {{studentName}}'s attendance has dropped to {{attendanceRate}}%, which is below the required 75% threshold mandated by the university.

{{aiInsight}}

Please reach out to the assigned mentor to discuss improvement strategies.

Best Regards,
Acme University Administration`;

export function Communications() {
  const [audience, setAudience] = useState("at-risk");
  const [channels, setChannels] = useState(["email"]);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Template Editor State
  const [templateContent, setTemplateContent] = useState(DEFAULT_TEMPLATE);
  const [tone, setTone] = useState("Urgent");
  const [language, setLanguage] = useState("English");
  const [subjectRef, setSubjectRef] = useState("Urgent: Attendance Alert for {{studentName}}");

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          audience, 
          channels, 
          message: templateContent,
          tone,
          language
        })
      });
      const data = await res.json();
      setJobId(data.jobId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseTemplate = (text: string) => {
    let result = text;
    Object.entries(MOCK_VARIABLES).forEach(([key, value]) => {
      // Replace all occurrences of {{key}}
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Config */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Communication Workflows</h2>
            <p className="text-sm text-gray-500 mt-1">Design and dispatch personalized alerts via Email, SMS, and WhatsApp.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-gray-500"/> Target Audience
                </label>
                <select 
                  value={audience} 
                  onChange={e => setAudience(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border"
                >
                  <option value="at-risk">Low Attendance (&lt; 75%)</option>
                  <option value="failing">Midterm Failure Risk</option>
                  <option value="all">Institution-wide Announcement</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500"/> Language
                </label>
                <select 
                  value={language} 
                  onChange={e => setLanguage(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border"
                >
                  <option value="English">English (Default)</option>
                  <option value="Hindi">Hindi (Regional)</option>
                  <option value="Punjabi">Punjabi (Regional)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500"/> Message Tone Config
              </label>
              <div className="flex gap-3">
                {['Formal', 'Supportive', 'Urgent'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
                      tone === t 
                        ? "bg-blue-50 border-blue-200 text-blue-700" 
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-gray-500"/> Dynamic Template Editor (Handlebars)
                </label>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5"/> Available vars: <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600 pr-1">{`{{studentName}}, {{cgpa}}, {{attendanceRate}}`}</code>
                </div>
              </div>
              
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={subjectRef}
                  onChange={e => setSubjectRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="Subject Line..."
                />
                <textarea
                  rows={8}
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-gray-800 leading-relaxed resize-none"
                  placeholder="Type your message template here..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <label className="text-sm font-medium text-gray-900">Delivery Channels</label>
              <div className="flex gap-4">
                {[
                  { id: "email", label: "Email", icon: Mail },
                  { id: "sms", label: "SMS", icon: Smartphone },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle }
                ].map((ch) => {
                  const active = channels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                        active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                      )}
                    >
                      <ch.icon className={cn("w-5 h-5 mb-1.5", active ? "text-blue-600" : "text-gray-400")} />
                      <span className="text-xs font-semibold">{ch.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
               <button
                  disabled={loading || channels.length === 0}
                  onClick={handleDispatch}
                  className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                >
                  {loading ? "Queueing Process..." : "Dispatch to Queue"}
                  <Send className="w-4 h-4 ml-2" />
                </button>
            </div>
          </div>
        </div>

        {jobId && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong className="font-bold text-green-800">Job enqueued:</strong> {jobId}. Background workers are processing this batch.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-1 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-sm flex flex-col h-[700px] sticky top-6">
        <div className="bg-white p-4 text-center border-b border-gray-200 shadow-sm z-10 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600 tracking-wider w-full text-center">LIVE RENDER PREVIEW</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Email Mock */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden text-sm">
            <div className="border-b border-gray-100 p-4 bg-slate-50 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-500 w-12 pt-0.5">To:</span> 
                <span className="text-gray-800">parent@example.com</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-500 w-12 pt-0.5">Subject:</span> 
                <span className="text-gray-800 font-medium">{parseTemplate(subjectRef)}</span>
              </div>
            </div>
            
            <div className="p-5 text-gray-800 leading-relaxed whitespace-pre-wrap">
              {parseTemplate(templateContent).split('\n').map((line, i) => {
                // Highlight AI Insight specifically for visual distinction in preview
                if (line.includes("AI Insight:")) {
                  return (
                    <div key={i} className="my-4 bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-100 shadow-sm relative md:col-span-1">
                      <div className="absolute -top-2.5 -left-2.5 bg-amber-100 text-amber-700 rounded-full p-1 border border-white">
                        <AlertTriangle className="w-4 h-4"/>
                      </div>
                      <div className="ml-3 font-medium">{line}</div>
                    </div>
                  );
                }
                return <React.Fragment key={i}>{line}<br/></React.Fragment>;
              })}
              
              <div className="mt-8 pt-4 border-t border-gray-100">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md w-full font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm">
                  Access Parent Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon(props: any) { return <Mail {...props} />; } // fallback
function CheckCircleIcon(props: any) { return <AlertTriangle {...props} />; }
