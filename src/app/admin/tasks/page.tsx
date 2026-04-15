import { createClient } from '@/lib/supabase/server'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const [{ data: tasks }, { data: companies }] = await Promise.all([
    supabase.from('tasks').select('*, companies(name)').order('due_date').order('created_at'),
    supabase.from('companies').select('id, name').eq('active', true).order('name'),
  ])
  return <TasksClient tasks={tasks ?? []} companies={companies ?? []} />
}
