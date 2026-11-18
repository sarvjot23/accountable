import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { errorMessage } from '../../lib/api';
import { STAGES, stage as stageOf, type StageKey } from '../../lib/stages';
import { ConfirmDelete } from '../../ui/ConfirmDelete';
import { Field, FormButtons, PrefixInput, TextInput, formStyles } from '../../ui/Field';
import { Picker, type PickerOption } from '../../ui/Picker';
import { Select } from '../../ui/Select';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { useContacts, type Contact } from '../contacts/api';
import { useOrganizations } from '../organizations/api';
import { useDealConsequences, useDeleteDeal, useSaveDeal, type Deal, type DealInput } from './api';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(160, 'Keep the name to 160 characters or fewer'),
  organization_id: z
    .number()
    .nullable()
    .refine((v): boolean => v !== null, 'Choose an organization'),
  contact_id: z.number().nullable(),
  stage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  value: z
    .string()
    .trim()
    .min(1, 'Enter a value')
    .refine((v) => /^\d{1,3}(,?\d{3})*$|^\d+$/.test(v), 'Enter the value in whole dollars'),
  probability: z
    .string()
    .trim()
    .refine((v) => /^\d{1,3}$/.test(v) && Number(v) <= 100, 'Enter a probability from 0 to 100'),
  close_date: z.string(),
});
type Values = z.infer<typeof schema>;

export interface DealPreset {
  organization_id?: number;
  contact_id?: number | null;
  stage?: StageKey;
}

/** FORM-3: the chosen organization's contacts first, then everyone else. */
export function contactOptions(
  contacts: Contact[],
  organizationId: number | null,
  organizationName?: string,
): PickerOption[] {
  const theirs = contacts.filter((c) => organizationId !== null && c.organization_id === organizationId);
  const others = contacts.filter((c) => !theirs.includes(c));
  const option = (c: Contact, group: string): PickerOption => ({
    value: c.id,
    label: c.name,
    hint: c.organization_name ?? c.job_title,
    group,
  });
  return [
    ...theirs.map((c) => option(c, `${organizationName ?? 'This organization'}`)),
    ...others.map((c) => option(c, theirs.length ? 'Other contacts' : 'Contacts')),
  ];
}

/** Add or edit a deal in a side sheet (FORM-1 to FORM-5, RULE-5). */
export function DealSheet({
  open,
  onOpenChange,
  deal,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
  preset?: DealPreset;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={deal ? 'Edit deal' : 'Add deal'}>
      {open && <DealForm deal={deal} preset={preset} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

/** The form's starting values: the deal's, or blanks with any preset organization, contact and stage. */
function startingValues(deal?: Deal, preset?: DealPreset): Values {
  if (!deal) {
    const stage = preset?.stage ?? 'new';
    return {
      name: '',
      organization_id: preset?.organization_id ?? null,
      contact_id: preset?.contact_id ?? null,
      stage,
      value: '',
      probability: String(stageOf(stage).probability),
      close_date: '',
    };
  }
  return {
    name: deal.name,
    organization_id: deal.organization_id,
    contact_id: deal.contact_id,
    stage: deal.stage as StageKey,
    value: String(deal.value),
    probability: String(deal.probability),
    close_date: deal.close_date ?? '',
  };
}

/** What's sent to the API. RULE-5: only a probability typed in by hand is sent, and then it's kept as manual. */
function toPayload(values: Values, probabilityTyped: boolean): DealInput {
  const payload: DealInput = {
    name: values.name,
    organization_id: values.organization_id,
    contact_id: values.contact_id,
    stage: values.stage,
    value: Number(values.value.replace(/,/g, '')),
    close_date: values.close_date || null,
  };
  if (probabilityTyped) payload.probability = Number(values.probability);
  return payload;
}

export function DealForm({ deal, preset, onDone }: { deal?: Deal; preset?: DealPreset; onDone: () => void }) {
  const save = useSaveDeal();
  const toast = useToast();
  const organizations = useOrganizations().data ?? [];
  const contacts = useContacts().data ?? [];
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: startingValues(deal, preset),
  });
  const organizationId = watch('organization_id');
  // RULE-5: typed in now, or saved by hand before and kept while the stage stays the same.
  const probabilityByHand =
    Boolean(dirtyFields.probability) || (deal?.probability_manual === true && watch('stage') === deal.stage);
  const organizationName = organizations.find((o) => o.id === organizationId)?.name;

  async function submit(values: Values) {
    setFormError(null);
    const payload = toPayload(values, Boolean(dirtyFields.probability));
    try {
      await save.mutateAsync({ id: deal?.id, values: payload });
      toast('Deal saved');
      onDone();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <form
      className={formStyles.form}
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label={deal ? 'Edit deal' : 'Add deal'}
    >
      <div className={formStyles.fields}>
        {formError && (
          <p className={formStyles.formError} role="alert">
            {formError}
          </p>
        )}
        <Field label="Name" htmlFor="deal-name" error={errors.name?.message}>
          <TextInput id="deal-name" data-autofocus aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Organization" htmlFor="deal-org" error={errors.organization_id?.message}>
          <Controller
            control={control}
            name="organization_id"
            render={({ field }) => (
              <Picker
                id="deal-org"
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose an organization"
                invalid={!!errors.organization_id}
                describedBy={errors.organization_id ? 'deal-org-error' : undefined}
                options={organizations.map((o) => ({ value: o.id, label: o.name, hint: o.industry }))}
              />
            )}
          />
        </Field>
        <Field label="Main contact" htmlFor="deal-contact">
          <Controller
            control={control}
            name="contact_id"
            render={({ field }) => (
              <Picker
                id="deal-contact"
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose a contact"
                noneLabel="No main contact"
                options={contactOptions(contacts, organizationId, organizationName)}
              />
            )}
          />
        </Field>
        <div className={formStyles.row}>
          <Field label="Stage" htmlFor="deal-stage">
            <Controller
              control={control}
              name="stage"
              render={({ field }) => (
                <Select
                  id="deal-stage"
                  label="Stage"
                  value={field.value}
                  onChange={(next) => {
                    field.onChange(next);
                    // The stage's usual probability, unless one was typed in by hand.
                    if (!dirtyFields.probability) {
                      setValue('probability', String(stageOf(next).probability), { shouldDirty: false });
                    }
                  }}
                  options={STAGES.map((s) => ({ value: s.key, label: s.label }))}
                />
              )}
            />
          </Field>
          <Field
            label="Probability (%)"
            htmlFor="deal-probability"
            error={errors.probability?.message}
            hint={probabilityByHand ? 'Set by hand' : 'The stage’s usual figure'}
          >
            <TextInput
              id="deal-probability"
              inputMode="numeric"
              className="mono"
              aria-invalid={!!errors.probability}
              {...register('probability')}
            />
          </Field>
        </div>
        <div className={formStyles.row}>
          <Field label="Value" htmlFor="deal-value" error={errors.value?.message}>
            <PrefixInput
              id="deal-value"
              prefix="US$"
              inputMode="numeric"
              placeholder="0"
              aria-invalid={!!errors.value}
              {...register('value')}
            />
          </Field>
          <Field label="Close date" htmlFor="deal-close">
            <TextInput id="deal-close" type="date" {...register('close_date')} />
          </Field>
        </div>
      </div>
      <FormButtons saving={save.isPending} onCancel={onDone} />
    </form>
  );
}

/** Ask before deleting a deal, saying its activities stay (DEL-1, RULE-10). */
export function DeleteDeal({
  deal,
  onOpenChange,
  onDeleted,
}: {
  deal: Pick<Deal, 'id' | 'name'> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteDeal();
  const toast = useToast();
  const consequences = useDealConsequences(deal?.id);
  return (
    <ConfirmDelete
      open={deal !== null}
      onOpenChange={onOpenChange}
      name={deal?.name ?? ''}
      consequences={consequences}
      onConfirm={async () => {
        await remove.mutateAsync(deal!.id);
        toast('Deal deleted');
        onDeleted?.();
      }}
    />
  );
}
