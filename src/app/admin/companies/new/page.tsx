import { redirect } from 'next/navigation'

// Cadastro manual removido — empresas são importadas automaticamente do Google Drive
export default function NewCompanyPage() {
  redirect('/admin/companies')
}
