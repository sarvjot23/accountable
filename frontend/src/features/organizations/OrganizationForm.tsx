import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { errorMessage } from '../../lib/api';
import { ConfirmDelete } from '../../ui/ConfirmDelete';
import { Field, FormButtons, TextArea, TextInput, formStyles } from '../../ui/Field';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import {
  useDeleteOrganization,
  useOrganizationConsequences,
  useOrganizations,
  useSaveOrganization,
  type Organization,
} from './api';

const WEB_ADDRESS = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(120, 'Keep the name to 120 characters or fewer'),
  website: z
    .string()
    .trim()
    .refine((v) => !v || WEB_ADDRESS.test(v), 'Enter a web address, such as northwind.com'),
  industry: z.string().trim().max(80, 'Keep the industry to 80 characters or fewer'),
  notes: z.string().max(5000, 'Keep the notes to 5,000 characters or fewer'),
});
type Values = z.infer<typeof schema>;

/** Add or edit an organization in a side sheet (TBL-3, FORM-1, FORM-5). */
export function OrganizationSheet({
  open,
  onOpenChange,
  organization,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Pick<Organization, 'id' | 'name' | 'website' | 'industry' | 'notes'>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={organization ? 'Edit organization' : 'Add organization'}>
      {open && <OrganizationForm organization={organization} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

function OrganizationForm({
  organization,
  onDone,
}: {
  organization?: Pick<Organization, 'id' | 'name' | 'website' | 'industry' | 'notes'>;
  onDone: () => void;
}) {
  const save = useSaveOrganization();
  const toast = useToast();
  const industries = [...new Set((useOrganizations().data ?? []).map((o) => o.industry).filter(Boolean))].sort();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization?.name ?? '',
      website: organization?.website ?? '',
      industry: organization?.industry ?? '',
      notes: organization?.notes ?? '',
    },
  });

  async function submit(values: Values) {
    setFormError(null);
    try {
      await save.mutateAsync({
        id: organization?.id,
        values: {
          name: values.name,
          website: values.website || null,
          industry: values.industry || null,
          notes: values.notes || null,
        },
      });
      toast('Organization saved');
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
        <Field label="Name" htmlFor="org-name" error={errors.name?.message}>
          <TextInput id="org-name" data-autofocus aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Website" htmlFor="org-website" error={errors.website?.message}>
          <TextInput
            id="org-website"
            placeholder="northwind.com"
            aria-invalid={!!errors.website}
            {...register('website')}
          />
        </Field>
        <Field label="Industry" htmlFor="org-industry" error={errors.industry?.message}>
          <TextInput
            id="org-industry"
            list="org-industries"
            aria-invalid={!!errors.industry}
            {...register('industry')}
          />
          <datalist id="org-industries">
            {industries.map((industry) => (
              <option key={industry} value={industry!} />
            ))}
          </datalist>
        </Field>
        <Field label="Notes" htmlFor="org-notes" error={errors.notes?.message}>
          <TextArea id="org-notes" rows={5} aria-invalid={!!errors.notes} {...register('notes')} />
        </Field>
      </div>
      <FormButtons saving={save.isPending} onCancel={onDone} />
    </form>
  );
}

/** Ask before deleting an organization, with the counts of what goes with it (DEL-1, RULE-8). */
export function DeleteOrganization({
  organization,
  onOpenChange,
  onDeleted,
}: {
  organization: Pick<Organization, 'id' | 'name'> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteOrganization();
  const toast = useToast();
  const consequences = useOrganizationConsequences(organization?.id);
  return (
    <ConfirmDelete
      open={organization !== null}
      onOpenChange={onOpenChange}
      name={organization?.name ?? ''}
      consequences={consequences}
      onConfirm={async () => {
        await remove.mutateAsync(organization!.id);
        toast('Organization deleted');
        onDeleted?.();
      }}
    />
  );
}
