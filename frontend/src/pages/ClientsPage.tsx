import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, Pencil, Users } from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import { clientSchema, type ClientFormValues } from '@/lib/validation'
import { Button, Input, Textarea, Card, Skeleton, EmptyState } from '@/components/ui/primitives'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Client } from '@/types/database'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const { data: clients, isLoading } = useClients(search)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (c: Client) => {
    setEditing(c)
    setModalOpen(true)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="mt-1 text-sm text-muted">Manage your client directory</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search name, company, email, phone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="mt-6 !p-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : clients && clients.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Country</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="px-5 py-3">
                    <Link to={`/clients/${c.id}`} className="font-medium text-white hover:text-accent-light">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.company || '—'}</td>
                  <td className="px-5 py-3 text-muted">{c.email || c.phone || '—'}</td>
                  <td className="px-5 py-3 text-muted">{c.country || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-muted hover:bg-danger/15 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client to start creating invoices."
              action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Client</Button>}
            />
          </div>
        )}
      </Card>

      {modalOpen && (
        <ClientFormModal
          client={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            if (editing) {
              await updateClient.mutateAsync({ id: editing.id, values })
            } else {
              await createClient.mutateAsync(values)
            }
            setModalOpen(false)
          }}
          submitting={createClient.isPending || updateClient.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete client?"
        description={`This will permanently remove ${deleteTarget?.name}. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteClient.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteClient.mutateAsync(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

function ClientFormModal({
  client, onClose, onSubmit, submitting,
}: {
  client: Client | null
  onClose: () => void
  onSubmit: (values: ClientFormValues) => Promise<void>
  submitting: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ?? {},
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">{client ? 'Edit Client' : 'Add Client'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Client Name" error={errors.name?.message} {...register('name')} />
          <Input label="Company Name" {...register('company')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="WhatsApp" {...register('whatsapp')} />
            <Input label="Country" {...register('country')} />
          </div>
          <Textarea label="Address" rows={2} {...register('address')} />
          <Input label="Tax Number (optional)" {...register('tax_number')} />
          <Textarea label="Notes" rows={2} {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
