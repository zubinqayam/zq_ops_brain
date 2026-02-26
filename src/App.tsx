import { useState, useRef, useEffect } from 'react'
import { 
  Mic, Send, Folder, CheckSquare, Calendar, Settings, 
  MessageSquare, Plus, 
  Lock, Key, Wifi, WifiOff, Battery, Signal, 
  ChevronDown, Clock, Trash2, Edit2,
  Shield, Zap, Database, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import './App.css'

// Types
interface Task {
  id: string
  title: string
  description?: string
  projectId?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  dueDate?: string
  createdAt: Date
}

interface Project {
  id: string
  name: string
  parentId?: string
  children?: Project[]
  createdAt: Date
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: ActionProposal
  timestamp: Date
}

interface ActionProposal {
  type: string
  title: string
  confidence: number
  data: Record<string, any>
}

// Mock Data
const mockProjects: Project[] = [
  { id: '1', name: 'Sohar Industrial', createdAt: new Date() },
  { id: '2', name: 'Clinic Mapping', parentId: '1', createdAt: new Date() },
  { id: '3', name: 'Solar Expansion', parentId: '1', createdAt: new Date() },
  { id: '4', name: 'Supplier Contracts', parentId: '1', createdAt: new Date() },
  { id: '5', name: 'Saada Hospital', createdAt: new Date() },
  { id: '6', name: 'USP Lab Reports', parentId: '5', createdAt: new Date() },
]

const mockTasks: Task[] = [
  { id: '1', title: 'Verify 3 clinics in Sohar', projectId: '2', priority: 'high', status: 'todo', dueDate: '2025-02-27', createdAt: new Date() },
  { id: '2', title: 'Schedule supplier meeting', projectId: '4', priority: 'medium', status: 'in_progress', dueDate: '2025-02-28', createdAt: new Date() },
  { id: '3', title: 'Review solar panel specs', projectId: '3', priority: 'low', status: 'todo', dueDate: '2025-03-01', createdAt: new Date() },
  { id: '4', title: 'Prepare USP Lab documentation', projectId: '6', priority: 'high', status: 'done', createdAt: new Date() },
]

// Command Parser
const parseCommand = (text: string): ActionProposal | null => {
  const lower = text.toLowerCase()
  
  if (lower.includes('create') && lower.includes('task')) {
    return {
      type: 'CREATE_TASK',
      title: 'Create New Task',
      confidence: 0.92,
      data: { title: text.replace(/create task:?/i, '').trim() }
    }
  }
  
  if (lower.includes('create') && lower.includes('project')) {
    return {
      type: 'CREATE_PROJECT',
      title: 'Create New Project',
      confidence: 0.88,
      data: { name: text.replace(/create project:?/i, '').trim() }
    }
  }
  
  if (lower.includes('remind')) {
    return {
      type: 'ADD_REMINDER',
      title: 'Set Reminder',
      confidence: 0.85,
      data: { text: text.replace(/remind me/i, '').trim() }
    }
  }
  
  return null
}

// Components
const StatusBar = ({ online, budget }: { online: boolean; budget: number }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        <span className={online ? 'text-emerald-400' : 'text-amber-400'}>
          {online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-zinc-400">
        <Shield className="w-3 h-3" />
        <span>SECURE</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <Database className="w-3 h-3" />
        <span>Budget: <span className="text-rose-400">{budget.toFixed(3)} OMR</span></span>
      </div>
      <div className="flex items-center gap-1 text-zinc-500">
        <Signal className="w-3 h-3" />
        <Battery className="w-3 h-3" />
      </div>
    </div>
  </div>
)

const ProjectTree = ({ 
  projects, 
  selectedId, 
  onSelect 
}: { 
  projects: Project[]
  selectedId?: string
  onSelect: (id: string) => void 
}) => {
  const renderProject = (project: Project, depth = 0) => {
    const children = projects.filter(p => p.parentId === project.id)
    const isSelected = selectedId === project.id
    
    return (
      <div key={project.id} style={{ marginLeft: depth * 16 }}>
        <button
          onClick={() => onSelect(project.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
            isSelected 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'hover:bg-zinc-800/50 text-zinc-300'
          }`}
        >
          {children.length > 0 ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <Folder className="w-4 h-4 text-zinc-500" />
          )}
          <span className="text-sm truncate">{project.name}</span>
        </button>
        {children.map(child => renderProject(child, depth + 1))}
      </div>
    )
  }
  
  const rootProjects = projects.filter(p => !p.parentId)
  return (
    <div className="space-y-1">
      {rootProjects.map(p => renderProject(p))}
    </div>
  )
}

const TaskCard = ({ 
  task, 
  onToggle, 
  onDelete 
}: { 
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void 
}) => {
  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  }
  
  return (
    <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors ${
      task.status === 'done' ? 'opacity-50' : ''
    }`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggle(task.id)}
            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              task.status === 'done'
                ? 'bg-emerald-500 border-emerald-500 text-zinc-900'
                : 'border-zinc-600 hover:border-zinc-500'
            }`}
          >
            {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
              {task.title}
            </p>
            {task.dueDate && (
              <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </Badge>
            <button 
              onClick={() => onDelete(task.id)}
              className="text-zinc-600 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ChatInterface = ({
  messages,
  onSend,
  isListening,
  onToggleListen
}: {
  messages: ChatMessage[]
  onSend: (text: string) => void
  isListening: boolean
  onToggleListen: () => void
}) => {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }
  
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                {msg.action && (
                  <div className="mt-3 p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium">{msg.action.title}</span>
                      <span className="text-xs text-zinc-400">({(msg.action.confidence * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
                <span className="text-xs opacity-50 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <button
            onClick={onToggleListen}
            className={`p-3 rounded-xl transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a command or ask a question..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
          />
          <Button 
            onClick={handleSend}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {isListening && (
          <p className="text-center text-sm text-rose-400 mt-2 animate-pulse">
            Listening... Speak your command
          </p>
        )}
      </div>
    </div>
  )
}

const KeyholeVault = () => {
  const [keys] = useState([
    { provider: 'OpenAI', masked: 'sk-••••••••••••••••••••••••••••••', status: 'active' },
    { provider: 'Gemini', masked: 'AI••••••••••••••••••••••••••••••', status: 'inactive' },
  ])
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-rose-400" />
          <h3 className="text-lg font-semibold text-zinc-200">Keyhole Vault</h3>
        </div>
        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <Shield className="w-3 h-3 mr-1" />
          AES-256
        </Badge>
      </div>
      
      <p className="text-sm text-zinc-400">
        API keys are encrypted using hardware-bound keys and never logged.
      </p>
      
      <div className="space-y-3">
        {keys.map((key) => (
          <Card key={key.provider} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-200">{key.provider}</p>
                  <p className="text-sm text-zinc-500 font-mono">{key.masked}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={key.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                    }
                  >
                    {key.status}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-8 text-zinc-400">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
        <Key className="w-4 h-4 mr-2" />
        Add API Key
      </Button>
    </div>
  )
}

// Main App
function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [online, setOnline] = useState(true)
  const [budget] = useState(2.450)
  const [isListening, setIsListening] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('1')
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [projects] = useState<Project[]>(mockProjects)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to ZQ Ops Brain. I can help you manage tasks, projects, and schedules. Try saying "Create task: Review clinic reports tomorrow" or type a command.',
      timestamp: new Date()
    }
  ])
  
  const handleSendMessage = (text: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    
    // Parse command
    const action = parseCommand(text)
    
    // Simulate AI response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: action 
          ? `I understood your request. Please confirm to proceed.`
          : `I received: "${text}". I'm still learning to understand this command. Try "Create task: [description]" or "Create project: [name]".`,
        action: action || undefined,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
      
      if (action) {
        toast.success(`Command parsed: ${action.title}`)
      }
    }, 800)
  }
  
  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, status: t.status === 'done' ? 'todo' : 'done' as Task['status'] }
        : t
    ))
  }
  
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Task deleted')
  }
  
  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      toast.info('Voice recognition activated')
      // Simulate voice input after 3 seconds
      setTimeout(() => {
        setIsListening(false)
        handleSendMessage('Create task: Schedule supplier call Friday 11am')
      }, 3000)
    }
  }
  
  const todayTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const projectTasks = tasks.filter(t => t.projectId === selectedProject)
  
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <StatusBar online={online} budget={budget} />
      
      {/* Header */}
      <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-100">ZQ Ops Brain</h1>
            <p className="text-xs text-zinc-500">Dv1 Golden Spike</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400"
            onClick={() => setOnline(!online)}
          >
            {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="text-zinc-400">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-900/30 px-2 py-2 h-auto">
            <TabsTrigger value="today" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <CheckSquare className="w-4 h-4 mr-1.5" />
              Today
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <Folder className="w-4 h-4 mr-1.5" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <Calendar className="w-4 h-4 mr-1.5" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <Settings className="w-4 h-4 mr-1.5" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            {/* Today Tab */}
            <TabsContent value="today" className="h-full m-0 p-4 overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-200">Today's Focus</h2>
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Quick Add
                  </Button>
                </div>
                
                {todayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {todayTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                    <CardContent className="p-8 text-center">
                      <CheckSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400">All caught up! No pending tasks.</p>
                    </CardContent>
                  </Card>
                )}
                
                {doneTasks.length > 0 && (
                  <>
                    <Separator className="bg-zinc-800" />
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 mb-3">Completed</h3>
                      <div className="space-y-3">
                        {doneTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            {/* Projects Tab */}
            <TabsContent value="projects" className="h-full m-0 flex">
              <div className="w-64 border-r border-zinc-800 p-4 bg-zinc-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-zinc-200">Projects</h3>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <ProjectTree 
                  projects={projects} 
                  selectedId={selectedProject}
                  onSelect={setSelectedProject}
                />
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-200">
                        {projects.find(p => p.id === selectedProject)?.name}
                      </h2>
                      <p className="text-sm text-zinc-500">
                        {projectTasks.length} tasks in this project
                      </p>
                    </div>
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {projectTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                    {projectTasks.length === 0 && (
                      <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                        <CardContent className="p-8 text-center">
                          <Folder className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                          <p className="text-zinc-400">No tasks in this project yet.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Tasks Tab */}
            <TabsContent value="tasks" className="h-full m-0 p-4 overflow-auto">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-zinc-200 mb-4">All Tasks</h2>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Chat Tab */}
            <TabsContent value="chat" className="h-full m-0">
              <ChatInterface 
                messages={messages}
                onSend={handleSendMessage}
                isListening={isListening}
                onToggleListen={toggleListening}
              />
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="h-full m-0 p-4 overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-semibold text-zinc-200">Settings</h2>
                
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">Keyhole Vault</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyholeVault />
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-zinc-200">Offline Mode</Label>
                        <p className="text-sm text-zinc-500">Disable external API calls</p>
                      </div>
                      <Switch 
                        checked={!online} 
                        onCheckedChange={(c) => setOnline(!c)}
                      />
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-zinc-200">Daily Budget Limit</Label>
                        <p className="text-sm text-zinc-500">Current: 5.000 OMR</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-zinc-700">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Version</span>
                      <span className="text-zinc-300">1.0.0-Dv1 (Golden Spike)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Build</span>
                      <span className="text-zinc-300">2025.02.26-release</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">License</span>
                      <span className="text-zinc-300">Apache 2.0</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

export default App
