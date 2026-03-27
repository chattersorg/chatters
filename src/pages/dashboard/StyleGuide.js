import React, { useState } from 'react';
import ModernCard from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import FilterSelect from '../../components/ui/FilterSelect';
import toast from 'react-hot-toast';
import {
  Star, TrendingUp, TrendingDown, Users, MessageSquare, Bell, Settings,
  Check, X, AlertTriangle, Info, ChevronDown, ChevronRight, ArrowRight,
  Plus, Edit, Trash2, Copy, Search, Download, Eye, EyeOff, Calendar,
  Clock, Mail, MapPin, ExternalLink, MoreHorizontal, Menu, Home,
  BarChart2, FileText, HelpCircle, LogOut, User, RefreshCw, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const StyleGuide = () => {
  usePageTitle('Style Guide');
  const [filterValue, setFilterValue] = useState('last7');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Sample chart data
  const lineChartData = [
    { name: 'Mon', value: 4.2 }, { name: 'Tue', value: 4.5 }, { name: 'Wed', value: 4.1 },
    { name: 'Thu', value: 4.8 }, { name: 'Fri', value: 4.6 }, { name: 'Sat', value: 4.9 }, { name: 'Sun', value: 4.7 },
  ];

  const barChartData = [
    { name: '5 stars', value: 145, fill: '#22c55e' },
    { name: '4 stars', value: 89, fill: '#4ade80' },
    { name: '3 stars', value: 34, fill: '#f59e0b' },
    { name: '2 stars', value: 12, fill: '#f97316' },
    { name: '1 star', value: 8, fill: '#ef4444' },
  ];

  const pieChartData = [
    { name: 'Promoters', value: 65, fill: '#22c55e' },
    { name: 'Passives', value: 25, fill: '#f59e0b' },
    { name: 'Detractors', value: 10, fill: '#ef4444' },
  ];

  // Table of Contents
  const sections = [
    { id: 'overview', label: 'Quick Reference' },
    { id: 'typography', label: 'Typography' },
    { id: 'colors', label: 'Colors' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'forms', label: 'Forms' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'tables', label: 'Tables' },
    { id: 'charts', label: 'Charts' },
    { id: 'icons', label: 'Icons' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'logos', label: 'Logos' },
  ];

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast.success(`Copied: ${label}`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Reusable components
  const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );

  const CodeBlock = ({ children, copyable = false, label = '' }) => (
    <code
      className={`inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 ${copyable ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''}`}
      onClick={copyable ? () => copyToClipboard(children, label || children) : undefined}
    >
      {children}
      {copyable && <Copy className="w-3 h-3 text-gray-400" />}
    </code>
  );

  const CodeSnippet = ({ code, label = '' }) => (
    <div className="relative group">
      <pre className="p-4 bg-gray-900 rounded-lg text-xs font-mono text-gray-100 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, label)}
        className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedCode === label ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  const Rule = ({ label, value, description }) => (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <span className="text-sm text-gray-900 dark:text-white">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <CodeBlock copyable label={label}>{value}</CodeBlock>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-48 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto z-40 hidden lg:block">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <img src="/img/chatters-icon-black.svg" alt="Chatters" className="h-5 dark:hidden" />
            <img src="/img/chatters-icon-white.svg" alt="Chatters" className="h-5 hidden dark:block" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Style Guide</span>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                  activeSection === section.id
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-48">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

          {/* Header */}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Chatters Design System</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Opinionated, minimal set of patterns for consistent UI
            </p>
          </div>

          {/* ==================== QUICK REFERENCE ==================== */}
          <Section id="overview" title="Quick Reference">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Typography</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Page title</span><code className="text-gray-500">text-lg font-semibold</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Card title / Label</span><code className="text-gray-500">text-sm font-medium</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Body text</span><code className="text-gray-500">text-sm</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Caption</span><code className="text-gray-500">text-xs text-gray-500</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Metric number</span><code className="text-gray-500">text-2xl font-semibold</code></div>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Colors</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Primary text</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-900 dark:bg-white"></div><code className="text-gray-500">gray-900</code></div></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Secondary text</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-600"></div><code className="text-gray-500">gray-600</code></div></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Success</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500"></div><code className="text-gray-500">green-500</code></div></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Warning</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500"></div><code className="text-gray-500">amber-500</code></div></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Error</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div><code className="text-gray-500">red-500</code></div></div>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Spacing</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Tight</span><code className="text-gray-500">gap-2 / p-2</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Standard</span><code className="text-gray-500">gap-4 / p-4</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Relaxed</span><code className="text-gray-500">gap-6 / p-6</code></div>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Buttons</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Primary</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600"></div><code className="text-gray-500">bg-blue-600</code></div></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Size</span><code className="text-gray-500">px-4 py-2 text-sm</code></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Radius</span><code className="text-gray-500">rounded-lg</code></div>
                </div>
              </ModernCard>
            </div>
          </Section>

          {/* ==================== TYPOGRAPHY ==================== */}
          <Section id="typography" title="Typography">
            <ModernCard padding="p-4" shadow="shadow-sm">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Font</p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <CodeBlock copyable label="font-stack">Plus Jakarta Sans, Geist, Gilroy, sans-serif</CodeBlock>
                <p className="text-xs text-gray-500 mt-2">CSS var: <code>--font-dashboard</code></p>
              </div>

              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 mt-6">Scale</p>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Page Title</span>
                  <CodeBlock copyable label="page-title">text-lg font-semibold text-gray-900 dark:text-white</CodeBlock>
                </div>
                <div className="flex items-baseline justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Card Title / Label</span>
                  <CodeBlock copyable label="card-title">text-sm font-medium text-gray-900 dark:text-white</CodeBlock>
                </div>
                <div className="flex items-baseline justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Body text for descriptions and content</span>
                  <CodeBlock copyable label="body">text-sm text-gray-600 dark:text-gray-400</CodeBlock>
                </div>
                <div className="flex items-baseline justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500">Caption / Timestamp</span>
                  <CodeBlock copyable label="caption">text-xs text-gray-500</CodeBlock>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-gray-900 dark:text-white">1,234</span>
                  <CodeBlock copyable label="metric">text-2xl font-semibold text-gray-900 dark:text-white</CodeBlock>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 mt-6">Weights (Use only these two)</p>
              <div className="flex gap-8">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Medium (500)</span>
                  <p className="text-xs text-gray-500">Titles, labels, buttons</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Semibold (600)</span>
                  <p className="text-xs text-gray-500">Page titles, metrics</p>
                </div>
              </div>
            </ModernCard>
          </Section>

          {/* ==================== COLORS ==================== */}
          <Section id="colors" title="Colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Text Colors</p>
                <div className="space-y-2">
                  <Rule label="Primary" value="text-gray-900 dark:text-white" description="Headings, important text" />
                  <Rule label="Secondary" value="text-gray-600 dark:text-gray-400" description="Body text, descriptions" />
                  <Rule label="Muted" value="text-gray-500" description="Captions, timestamps" />
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Background</p>
                <div className="space-y-2">
                  <Rule label="Page" value="bg-gray-50 dark:bg-gray-950" />
                  <Rule label="Card" value="bg-white dark:bg-gray-900" />
                  <Rule label="Hover" value="hover:bg-gray-100 dark:hover:bg-gray-800" />
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Semantic</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Success</span>
                    </div>
                    <CodeBlock copyable>green-500</CodeBlock>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-500"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Warning</span>
                    </div>
                    <CodeBlock copyable>amber-500</CodeBlock>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Error</span>
                    </div>
                    <CodeBlock copyable>red-500</CodeBlock>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Info</span>
                    </div>
                    <CodeBlock copyable>blue-500</CodeBlock>
                  </div>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Rating Scale</p>
                <div className="flex gap-2">
                  {[
                    { score: 5, color: 'bg-green-500' },
                    { score: 4, color: 'bg-green-400' },
                    { score: 3, color: 'bg-amber-500' },
                    { score: 2, color: 'bg-orange-500' },
                    { score: 1, color: 'bg-red-500' },
                  ].map(({ score, color }) => (
                    <div key={score} className={`w-8 h-8 ${color} rounded flex items-center justify-center text-white text-sm font-medium`}>
                      {score}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">5: green-500, 4: green-400, 3: amber-500, 2: orange-500, 1: red-500</p>
              </ModernCard>
            </div>
          </Section>

          {/* ==================== BUTTONS ==================== */}
          <Section id="buttons" title="Buttons">
            <ModernCard padding="p-4" shadow="shadow-sm">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Standard Button (One size fits all)</p>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Primary
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Secondary
                </button>
                <button className="px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Ghost
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  Danger
                </button>
              </div>

              <CodeSnippet
                label="buttons"
                code={`// Primary (default action)
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
  Button
</button>

// Secondary (alternative action)
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
  Button
</button>

// Ghost (tertiary)
<button className="px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
  Button
</button>

// Danger (destructive)
<button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
  Delete
</button>`}
              />
            </ModernCard>

            <ModernCard padding="p-4" shadow="shadow-sm" className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">With Icons</p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" /> Add New
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">Icons: <code>w-4 h-4</code> with <code>gap-2</code></p>
            </ModernCard>

            <ModernCard padding="p-4" shadow="shadow-sm" className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">States</p>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
                  Disabled
                </button>
                <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-75 cursor-not-allowed">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </button>
              </div>
            </ModernCard>
          </Section>

          {/* ==================== FORMS ==================== */}
          <Section id="forms" title="Forms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Text Input</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">With Error</label>
                    <input
                      type="text"
                      defaultValue="Invalid"
                      className="w-full px-4 py-2 border border-red-500 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-xs text-red-500 mt-1">Error message</p>
                  </div>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select</p>
                <FilterSelect
                  label="Date Range"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  options={[
                    { value: 'today', label: 'Today' },
                    { value: 'last7', label: 'Last 7 days' },
                    { value: 'last30', label: 'Last 30 days' },
                  ]}
                />
                <p className="text-xs text-gray-500 mt-2">Use <code>FilterSelect</code> from <code>components/ui/FilterSelect</code></p>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Checkbox & Radio</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                    Checkbox option
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="demo" defaultChecked className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900" />
                    Radio option
                  </label>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Toggle</p>
                <div className="flex items-center gap-4">
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-900 dark:bg-white">
                    <span className="h-4 w-4 translate-x-6 rounded-full bg-white dark:bg-gray-900 transition-transform" />
                  </button>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <span className="h-4 w-4 translate-x-1 rounded-full bg-white transition-transform" />
                  </button>
                </div>
              </ModernCard>
            </div>
          </Section>

          {/* ==================== CARDS ==================== */}
          <Section id="cards" title="Cards">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">1,234</div>
                <p className="text-xs text-gray-500 mt-0.5">42/day average</p>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-semibold text-gray-900 dark:text-white">4.8</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600">
                    <TrendingUp className="w-3 h-3" /> +12%
                  </span>
                </div>
              </ModernCard>

              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">NPS Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-2xl font-semibold text-green-600">+72</span>
                </div>
              </ModernCard>
            </div>

            <ModernCard padding="p-4" shadow="shadow-sm" className="mt-4">
              <CodeSnippet
                label="card"
                code={`import ModernCard from 'components/dashboard/layout/ModernCard';

<ModernCard padding="p-4" shadow="shadow-sm">
  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Label</p>
  <div className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">1,234</div>
  <p className="text-xs text-gray-500 mt-0.5">Subtext</p>
</ModernCard>`}
              />
            </ModernCard>
          </Section>

          {/* ==================== BADGES ==================== */}
          <Section id="badges" title="Badges">
            <ModernCard padding="p-4" shadow="shadow-sm">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status Badges</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  <Check className="w-3 h-3" /> Active
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" /> Pending
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                  <X className="w-3 h-3" /> Failed
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  Inactive
                </span>
              </div>

              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Trend Badges</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" /> +15%
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                  <TrendingDown className="w-3 h-3" /> -8%
                </span>
              </div>

              <CodeSnippet
                label="badge"
                code={`// Status badge
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
  <Check className="w-3 h-3" /> Active
</span>

// Color variants:
// Success: bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400
// Warning: bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400
// Error:   bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400
// Neutral: bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400`}
              />
            </ModernCard>
          </Section>

          {/* ==================== FEEDBACK (Toasts & Alerts) ==================== */}
          <Section id="feedback" title="Feedback">
            <ModernCard padding="p-4" shadow="shadow-sm">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Toast Notifications (Click to trigger)</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => toast.success('Changes saved!')}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                >
                  Success
                </button>
                <button
                  onClick={() => toast.error('Something went wrong')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                >
                  Error
                </button>
                <button
                  onClick={() => toast.loading('Loading...', { duration: 2000 })}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700"
                >
                  Loading
                </button>
              </div>

              <CodeSnippet
                label="toast"
                code={`import toast from 'react-hot-toast';

toast.success('Saved!');
toast.error('Failed');
toast.loading('Loading...', { duration: 2000 });

// With promise
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed'
});`}
              />
            </ModernCard>

            <ModernCard padding="p-4" shadow="shadow-sm" className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Inline Alerts</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">Success message</p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">Warning message</p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <X className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">Error message</p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">Info message</p>
                </div>
              </div>
            </ModernCard>

            <ModernCard padding="p-4" shadow="shadow-sm" className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Modal</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Open Modal
              </button>
            </ModernCard>

            {/* Modal */}
            {isModalOpen && (
              <>
                <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsModalOpen(false)} />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-sm font-medium text-gray-900 dark:text-white">Modal Title</h2>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Modal content goes here.</p>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                        Cancel
                      </button>
                      <button onClick={() => { toast.success('Confirmed!'); setIsModalOpen(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* ==================== TABLES ==================== */}
          <Section id="tables" title="Tables">
            <ModernCard padding="p-0" shadow="shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                      { name: 'John Doe', email: 'john@example.com', status: 'Active', role: 'Admin' },
                      { name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', role: 'Manager' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{row.name}</p>
                          <p className="text-xs text-gray-500">{row.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            row.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.role}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ModernCard>

            <ModernCard padding="p-4" shadow="shadow-sm" className="mt-4">
              <CodeSnippet
                label="table"
                code={`// Header cell
className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"

// Body row
className="hover:bg-gray-50 dark:hover:bg-gray-800/50"

// Body cell
className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400"`}
              />
            </ModernCard>
          </Section>

          {/* ==================== CHARTS ==================== */}
          <Section id="charts" title="Charts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sparkline - from MultiVenueMetricCard */}
              <ModernCard padding="p-5" shadow="shadow-sm">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Sessions</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">1,234</span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" /> +12%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">compared to last week</p>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        width={35}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-3">Sparkline pattern from <code>MultiVenueMetricCard</code></p>
              </ModernCard>

              {/* Bar Chart - NPS style from MultiVenueNPSCard */}
              <ModernCard padding="p-5" shadow="shadow-sm">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">NPS Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+72</span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" /> +5
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">compared to previous period</p>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Promoters', value: 65, color: '#22c55e' },
                        { name: 'Passives', value: 25, color: '#f59e0b' },
                        { name: 'Detractors', value: 10, color: '#ef4444' }
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        width={90}
                      />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {[
                          { name: 'Promoters', value: 65, color: '#22c55e' },
                          { name: 'Passives', value: 25, color: '#f59e0b' },
                          { name: 'Detractors', value: 10, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {[
                      { name: 'Promoters', value: 65, color: '#22c55e' },
                      { name: 'Passives', value: 25, color: '#f59e0b' },
                      { name: 'Detractors', value: 10, color: '#ef4444' }
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}:</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">Bar pattern from <code>MultiVenueNPSCard</code></p>
              </ModernCard>

              {/* Donut Chart */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Donut Chart</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ModernCard>

              {/* Chart colors reference */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Chart Color Palette</p>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { color: '#8b5cf6', name: 'Purple' },
                    { color: '#3b82f6', name: 'Blue' },
                    { color: '#22c55e', name: 'Green' },
                    { color: '#f97316', name: 'Orange' },
                    { color: '#ec4899', name: 'Pink' },
                    { color: '#14b8a6', name: 'Teal' },
                    { color: '#f59e0b', name: 'Amber' },
                    { color: '#6366f1', name: 'Indigo' },
                    { color: '#ef4444', name: 'Red' },
                    { color: '#06b6d4', name: 'Cyan' },
                  ].map(({ color, name }) => (
                    <div key={name} className="text-center">
                      <div className="w-8 h-8 rounded mx-auto mb-1" style={{ backgroundColor: color }} />
                      <span className="text-[9px] text-gray-500">{name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Multi-venue charts use this palette for venue lines. Library: <code>recharts</code></p>
              </ModernCard>
            </div>
          </Section>

          {/* ==================== ICONS ==================== */}
          <Section id="icons" title="Icons">
            <ModernCard padding="p-4" shadow="shadow-sm">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Common Icons (Click to copy)</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {[
                  { Icon: Star, name: 'Star' }, { Icon: TrendingUp, name: 'TrendingUp' }, { Icon: TrendingDown, name: 'TrendingDown' },
                  { Icon: Users, name: 'Users' }, { Icon: User, name: 'User' }, { Icon: MessageSquare, name: 'MessageSquare' },
                  { Icon: Bell, name: 'Bell' }, { Icon: Settings, name: 'Settings' }, { Icon: Check, name: 'Check' },
                  { Icon: X, name: 'X' }, { Icon: AlertTriangle, name: 'AlertTriangle' }, { Icon: Info, name: 'Info' },
                  { Icon: ChevronDown, name: 'ChevronDown' }, { Icon: ChevronRight, name: 'ChevronRight' }, { Icon: ArrowRight, name: 'ArrowRight' },
                  { Icon: Plus, name: 'Plus' }, { Icon: Edit, name: 'Edit' }, { Icon: Trash2, name: 'Trash2' },
                  { Icon: Copy, name: 'Copy' }, { Icon: Search, name: 'Search' }, { Icon: Download, name: 'Download' },
                  { Icon: Eye, name: 'Eye' }, { Icon: EyeOff, name: 'EyeOff' }, { Icon: Calendar, name: 'Calendar' },
                  { Icon: Clock, name: 'Clock' }, { Icon: Mail, name: 'Mail' }, { Icon: MapPin, name: 'MapPin' },
                  { Icon: ExternalLink, name: 'ExternalLink' }, { Icon: MoreHorizontal, name: 'MoreHorizontal' }, { Icon: Menu, name: 'Menu' },
                  { Icon: Home, name: 'Home' }, { Icon: BarChart2, name: 'BarChart2' }, { Icon: FileText, name: 'FileText' },
                  { Icon: HelpCircle, name: 'HelpCircle' }, { Icon: LogOut, name: 'LogOut' }, { Icon: RefreshCw, name: 'RefreshCw' },
                  { Icon: Loader2, name: 'Loader2' },
                ].map(({ Icon, name }) => (
                  <button
                    key={name}
                    onClick={() => copyToClipboard(`<${name} className="w-4 h-4" />`, name)}
                    className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={name}
                  >
                    <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    <span className="text-[9px] text-gray-500 truncate w-full text-center">{name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Standard size: <code>w-4 h-4</code> | Library: <code>lucide-react</code>
              </p>
            </ModernCard>
          </Section>

          {/* ==================== SPACING ==================== */}
          <Section id="spacing" title="Spacing">
            <ModernCard padding="p-4" shadow="shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Gap / Padding</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-600">Tight</span><code className="text-gray-500">gap-2 / p-2 (8px)</code></div>
                    <div className="flex justify-between"><span className="text-gray-600">Standard</span><code className="text-gray-500">gap-4 / p-4 (16px)</code></div>
                    <div className="flex justify-between"><span className="text-gray-600">Relaxed</span><code className="text-gray-500">gap-6 / p-6 (24px)</code></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Border Radius</p>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <span className="text-[10px] text-gray-500">rounded</span>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      <span className="text-[10px] text-gray-500">rounded-lg</span>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <span className="text-[10px] text-gray-500">rounded-full</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Shadows</p>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm"></div>
                      <span className="text-[10px] text-gray-500">shadow-sm</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg shadow"></div>
                      <span className="text-[10px] text-gray-500">shadow</span>
                    </div>
                  </div>
                </div>
              </div>
            </ModernCard>
          </Section>

          {/* ==================== LOGOS ==================== */}
          <Section id="logos" title="Logos">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Logo assets used in the dashboard sidebar and marketing site.
            </p>

            {/* Icons - used in sidebar */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Icons (Sidebar)</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Icon - Light background (dark icon) */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <div className="p-4 bg-white border border-gray-200 rounded flex items-center justify-center mb-2 h-16">
                  <img src="/img/logo/chatters-logo-black-2025.svg" alt="Icon" className="h-6" />
                </div>
                <p className="text-xs text-gray-500 text-center">Icon (Light BG)</p>
                <p className="text-[10px] text-gray-400 text-center mt-1 font-mono">/img/logo/chatters-logo-black-2025.svg</p>
              </ModernCard>

              {/* Icon - Dark background (white icon) */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <div className="p-4 bg-gray-900 rounded flex items-center justify-center mb-2 h-16">
                  <img src="/img/logo/chatters-logo-white-2025.svg" alt="Icon" className="h-6" />
                </div>
                <p className="text-xs text-gray-500 text-center">Icon (Dark BG)</p>
                <p className="text-[10px] text-gray-400 text-center mt-1 font-mono">/img/logo/chatters-logo-white-2025.svg</p>
              </ModernCard>
            </div>

            {/* Full Logos */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Full Logos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full logo - Light background */}
              <ModernCard padding="p-0" shadow="shadow-sm" className="overflow-hidden">
                <div className="p-8 bg-white border-b border-gray-200 flex items-center justify-center">
                  <img src="/img/logo/chatters-logo-2025.svg" alt="Logo" className="h-10 max-w-full" />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 text-center">Full Logo (Light BG)</p>
                  <p className="text-[10px] text-gray-400 text-center mt-1 font-mono">/img/logo/chatters-logo-2025.svg</p>
                </div>
              </ModernCard>

              {/* Full logo - Dark background */}
              <ModernCard padding="p-0" shadow="shadow-sm" className="overflow-hidden">
                <div className="p-8 bg-gray-900 flex items-center justify-center">
                  <img src="/img/logo/chatters-large-logo-white.svg" alt="Logo" className="h-10 max-w-full" />
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 text-center">Full Logo (Dark BG)</p>
                  <p className="text-[10px] text-gray-400 text-center mt-1 font-mono">/img/logo/chatters-large-logo-white.svg</p>
                </div>
              </ModernCard>
            </div>
          </Section>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 text-center">
            <p className="text-xs text-gray-500">Chatters Design System &middot; January 2025</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StyleGuide;
