import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { OrganisationFormValues, OrganisationStatus } from '../types/organisation'
import copy from '../locales/en.json'

interface OrganisationFormProps {
  onSubmit: (values: OrganisationFormValues) => void | Promise<void>
  onCancel: () => void
}

const statuses: [OrganisationStatus, ...OrganisationStatus[]] = ['Active', 'Inactive', 'Suspended', 'Unknown']
const schema = z.object({
  name: z.string().trim().min(1, copy.form.required),
  status: z.enum(statuses),
  memberCount: z.number({ message: copy.form.invalidCount }).int(copy.form.invalidCount).nonnegative(copy.form.invalidCount),
  ownerEmail: z.string().trim().email(copy.form.invalidEmail),
})

export function OrganisationForm({ onSubmit, onCancel }: OrganisationFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrganisationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', status: 'Active', memberCount: 0, ownerEmail: '' },
  })

  return (
    <form className="organisation-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor="organisation-name">{copy.form.name}</label>
        <input id="organisation-name" placeholder={copy.form.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'organisation-name-error' : undefined} {...register('name')} />
        {errors.name && <span className="field-error" id="organisation-name-error">{errors.name.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="organisation-members">{copy.form.memberCount}</label>
        <input id="organisation-members" type="number" min="0" step="1" placeholder={copy.form.memberCountPlaceholder} aria-invalid={Boolean(errors.memberCount)} aria-describedby={errors.memberCount ? 'organisation-members-error' : undefined} {...register('memberCount', { valueAsNumber: true })} />
        {errors.memberCount && <span className="field-error" id="organisation-members-error">{errors.memberCount.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="organisation-owner">{copy.form.ownerEmail}</label>
        <input id="organisation-owner" type="email" placeholder={copy.form.ownerEmailPlaceholder} aria-invalid={Boolean(errors.ownerEmail)} aria-describedby={errors.ownerEmail ? 'organisation-owner-error' : undefined} {...register('ownerEmail')} />
        {errors.ownerEmail && <span className="field-error" id="organisation-owner-error">{errors.ownerEmail.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="organisation-status">{copy.form.status}</label>
        <select id="organisation-status" {...register('status')}>
          {statuses.map((status) => <option key={status} value={status}>{copy.status[status]}</option>)}
        </select>
      </div>
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>{copy.form.cancel}</button>
        <button className="button button--primary" type="submit" disabled={isSubmitting}>{copy.form.submit}</button>
      </div>
    </form>
  )
}
