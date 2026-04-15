export type Role = 'admin' | 'client'
export type TaskStatus = 'pending' | 'done' | 'overdue'
export type DocCategory = 'folha' | 'imposto' | 'prontuario' | 'geral'

export interface Company {
  id: string
  code: string | null
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  contact_name: string | null
  drive_folder_url: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface Profile {
  id: string
  company_id: string | null
  full_name: string | null
  role: Role
  created_at: string
}

export interface ClientDocument {
  id: string
  company_id: string
  name: string
  category: DocCategory
  drive_url: string
  year: number | null
  month: number | null
  uploaded_by: string | null
  created_at: string
}

export interface Message {
  id: string
  company_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  profiles?: { full_name: string | null; role: Role }
}

export interface Task {
  id: string
  company_id: string | null
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  created_by: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      companies: { Row: Company; Insert: Partial<Company>; Update: Partial<Company> }
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      documents: { Row: ClientDocument; Insert: Partial<ClientDocument>; Update: Partial<ClientDocument> }
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> }
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
