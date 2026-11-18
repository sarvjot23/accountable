import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { errorMessage } from '../../lib/api';
import { ConfirmDelete } from '../../ui/ConfirmDelete';
import { Field, FormButtons, TextInput, formStyles } from '../../ui/Field';
import { Picker } from '../../ui/Picker';
import { Select } from '../../ui/Select';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { useOrganizations } from '../organizations/api';
import { STATUSES, useContactConsequences, useDeleteContact, useSaveContact, type Contact } from './api';

const schema = z.object({
  first_name: z.string().trim().min(1, 'Enter a first name').max(80, 'Keep the first name to 80 characters or fewer'),
  last_name: z.string().trim().max(80, 'Keep the last name to 80 characters or fewer'),
  email: z
    .string()
    .trim()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter an email address, such as sam@northwind.com'),
  phone: z.string().trim().max(40, 'Keep the phone number to 40 characters or fewer'),
  job_title: z.string().trim().max(120, 'Keep the job title to 120 characters or fewer'),
  organization_id: z.number().nullable(),
  status: z.enum(['lead', 'qualified', 'customer']),
});
type Values = z.infer<typeof schema>;

/** Add or edit a contact in a side sheet. New contacts start as leads (DATA-3). */
export function ContactSheet({
  open,
  onOpenChange,
  contact,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  preset?: { organization_id?: number };
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={contact ? 'Edit contact' : 'Add contact'}>
      {open && <ContactForm contact={contact} preset={preset} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

/** The form's starting values: the contact's, or blanks with any preset organization. */
function startingValues(contact?: Contact, preset?: { organization_id?: number }): Values {
  if (!contact) {
    const blank = { first_name: '', last_name: '', email: '', phone: '', job_title: '' };
    return { ...blank, organization_id: preset?.organization_id ?? null, status: 'lead' };
  }
  return {
    first_name: contact.first_name,
    last_name: contact.last_name ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    job_title: contact.job_title ?? '',
    organization_id: contact.organization_id,
    status: contact.status,
  };
}

function ContactForm({
  contact,
  preset,
  onDone,
}: {
  contact?: Contact;
  preset?: { organization_id?: number };
  onDone: () => void;
}) {
  const save = useSaveContact();
  const toast = useToast();
  const organizations = useOrganizations().data ?? [];
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: startingValues(contact, preset),
  });

  async function submit(values: Values) {
    setFormError(null);
    try {
      await save.mutateAsync({
        id: contact?.id,
        values: {
          ...values,
          last_name: values.last_name || null,
          email: values.email || null,
          phone: values.phone || null,
          job_title: values.job_title || null,
        },
      });
      toast('Contact saved');
      onDone();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit(submit)} noValidate>
      <div className={formStyles.fields}>
        {formError && (
          <p className={formStyles.formError} role="alert">
            {formError}
          </p>
        )}
        <div className={formStyles.row}>
          <Field label="First name" htmlFor="contact-first" error={errors.first_name?.message}>
            <TextInput
              id="contact-first"
              data-autofocus
              aria-invalid={!!errors.first_name}
              {...register('first_name')}
            />
          </Field>
          <Field label="Last name" htmlFor="contact-last" error={errors.last_name?.message}>
            <TextInput id="contact-last" aria-invalid={!!errors.last_name} {...register('last_name')} />
          </Field>
        </div>
        <Field label="Organization" htmlFor="contact-org">
          <Controller
            control={control}
            name="organization_id"
            render={({ field }) => (
              <Picker
                id="contact-org"
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose an organization"
                noneLabel="No organization"
                options={organizations.map((o) => ({ value: o.id, label: o.name, hint: o.industry }))}
              />
            )}
          />
        </Field>
        <Field label="Job title" htmlFor="contact-job" error={errors.job_title?.message}>
          <TextInput id="contact-job" aria-invalid={!!errors.job_title} {...register('job_title')} />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={errors.email?.message}>
          <TextInput id="contact-email" type="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Phone" htmlFor="contact-phone" error={errors.phone?.message}>
          <TextInput id="contact-phone" type="tel" aria-invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label="Status" htmlFor="contact-status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                id="contact-status"
                label="Status"
                value={field.value}
                onChange={field.onChange}
                options={STATUSES.map((s) => ({ value: s.key, label: s.label }))}
              />
            )}
          />
        </Field>
      </div>
      <FormButtons saving={save.isPending} onCancel={onDone} />
    </form>
  );
}

/** Ask before deleting a contact, saying their activities and deals stay (DEL-1, RULE-9). */
export function DeleteContact({
  contact,
  onOpenChange,
  onDeleted,
}: {
  contact: Pick<Contact, 'id' | 'name'> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteContact();
  const toast = useToast();
  const consequences = useContactConsequences(contact?.id);
  return (
    <ConfirmDelete
      open={contact !== null}
      onOpenChange={onOpenChange}
      name={contact?.name ?? ''}
      consequences={consequences}
      onConfirm={async () => {
        await remove.mutateAsync(contact!.id);
        toast('Contact deleted');
        onDeleted?.();
      }}
    />
  );
}
